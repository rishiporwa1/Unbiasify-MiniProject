"""
analyzer/utils.py — Full NLP analysis engine for Unbiasify.

Performs:
  - Sentiment analysis (TextBlob)
  - Bias detection: loaded language, unsupported generalisation,
    stereotyping/group targeting, one-sided framing
  - Tone analysis (formality, warmth, urgency, aggression)
  - Readability metrics (Flesch approximation)
  - Rewrite suggestion

No external API calls — all logic is local Python + NLTK + TextBlob + re.
"""

import re
import json
from textblob import TextBlob

# ---------------------------------------------------------------------------
# NLTK sentence tokeniser with graceful fallback
# ---------------------------------------------------------------------------
try:
    import nltk
    nltk.data.find('tokenizers/punkt')
    _USE_NLTK = True
except LookupError:
    try:
        nltk.download('punkt', quiet=True)
        nltk.data.find('tokenizers/punkt')
        _USE_NLTK = True
    except Exception:
        _USE_NLTK = False
except Exception:
    _USE_NLTK = False


def _sent_tokenize(text):
    """Split text into sentences using NLTK when available, regex otherwise."""
    if _USE_NLTK:
        try:
            import nltk
            return nltk.sent_tokenize(text)
        except Exception:
            pass
    # Regex fallback: split on . ! ? followed by whitespace or end
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]


# ---------------------------------------------------------------------------
# Word-level helpers
# ---------------------------------------------------------------------------

def _count_syllables(word):
    """Approximate syllable count by counting vowel groups."""
    word = word.lower().strip(".,!?;:'\"()")
    if not word:
        return 0
    count = len(re.findall(r'[aeiou]+', word))
    return max(count, 1)


def _words(text):
    """Return list of whitespace-split tokens, stripped of punctuation."""
    return [w.strip(".,!?;:'\"()[]{}") for w in text.split() if w.strip(".,!?;:'\"()[]{}")]


# ---------------------------------------------------------------------------
# LOADED / EMOTIVE LANGUAGE — word lists + neutral alternatives
# ---------------------------------------------------------------------------

# (pattern_regex, confidence, suggestion_or_None)
_ABSOLUTE_TERMS = [
    (r'\balways\b',       'high', 'often'),
    (r'\bnever\b',        'high', 'rarely'),
    (r'\beveryone\b',     'high', 'many people'),
    (r'\bnobody\b',       'high', 'few people'),
    (r'\ball\b',          'high', 'many'),
    (r'\bnone\b',         'high', 'few'),
    (r'\bevery\b',        'high', 'many'),
    (r'\bcompletely\b',   'high', 'largely'),
    (r'\btotally\b',      'high', 'largely'),
    (r'\babsolutely\b',   'high', 'substantially'),
    (r'\bobviously\b',    'high', 'arguably'),
    (r'\bclearly\b',      'high', 'arguably'),
    (r'\bundoubtedly\b',  'high', 'arguably'),
    (r'\bcertainly\b',    'high', 'arguably'),
    (r'\bdefinitely\b',   'high', 'likely'),
    (r'\binevitably\b',   'high', 'possibly'),
    (r'\bundeniably\b',   'high', 'arguably'),
]

_CHARGED_ADJECTIVES = [
    (r'\bterrible\b',      'medium', 'poor'),
    (r'\bhorrible\b',      'medium', 'poor'),
    (r'\bdisgustin\w*\b',  'medium', 'objectionable'),
    (r'\boutrageous\b',    'medium', 'concerning'),
    (r'\bshameful\b',      'medium', 'problematic'),
    (r'\bdisgraceful\b',   'medium', 'problematic'),
    (r'\bappalling\b',     'medium', 'concerning'),
    (r'\bhideous\b',       'medium', 'unappealing'),
    (r'\bvile\b',          'medium', 'objectionable'),
    (r'\bdespicable\b',    'medium', 'objectionable'),
    (r'\bpathetic\b',      'medium', 'inadequate'),
    (r'\bworthless\b',     'medium', 'of limited value'),
    (r'\buseless\b',       'medium', 'ineffective'),
    (r'\bidiotic\b',       'medium', 'misguided'),
    (r'\bmoronic\b',       'medium', 'misguided'),
    (r'\bstupid\b',        'medium', 'misguided'),
    (r'\bbrilliant\b',     'medium', 'effective'),
    (r'\bamazing\b',       'medium', 'notable'),
    (r'\bperfect\b',       'medium', 'effective'),
]

_LOADED_VERBS = [
    (r'\bdestroy\b',    'medium', 'significantly harm'),
    (r'\bdevastate\b',  'medium', 'seriously affect'),
    (r'\bcrush\b',      'medium', 'overcome'),
    (r'\bannihilate\b', 'medium', 'defeat'),
    (r'\bslam\b',       'medium', 'criticise'),
    (r'\bblast\b',      'medium', 'criticise'),
    (r'\bbetra\w*\b',   'medium', 'disappoint'),
]

# Combined list of all loaded-language patterns
_LOADED_PATTERNS = _ABSOLUTE_TERMS + _CHARGED_ADJECTIVES + _LOADED_VERBS

_LOADED_EXPLANATION = (
    "Uses an absolute/charged term that may push an emotional reaction beyond "
    "the factual claim. Consider more measured wording."
)

# ---------------------------------------------------------------------------
# NEGATION WORDS — downgrade confidence when immediately preceding a match
# ---------------------------------------------------------------------------
_NEGATION_WORDS = {
    'not', 'no', 'never', 'neither', 'nor', 'without',
    'hardly', 'barely', 'scarcely',
}

# ---------------------------------------------------------------------------
# GROUP NOUNS for generalisation detection
# ---------------------------------------------------------------------------
_GROUP_NOUNS = (
    r'(?:people|men|women|kids|children|millennials|boomers|gen z|gen x|'
    r'liberals|conservatives|republicans|democrats|politicians|academics|'
    r'doctors|lawyers|teachers|students|workers|immigrants|refugees|'
    r'christians|muslims|jews|hindus|atheists|scientists|journalists|'
    r'artists|athletes|celebrities|billionaires|executives|employees|'
    r'parents|seniors|teenagers|youth)'
)

_EVAL_ADJECTIVE = (
    r'(?:lazy|smart|stupid|violent|peaceful|honest|dishonest|criminal|corrupt|'
    r'hard-?working|talented|incompetent|selfish|generous|dangerous|safe|'
    r'greedy|kind|mean|arrogant|humble|ignorant|educated|uneducated|reliable|'
    r'unreliable|trustworthy|untrustworthy|moral|immoral|good|bad|better|worse|'
    r'superior|inferior)'
)

_GENERALIZATION_PATTERNS = [
    # "GROUP are/is EVAL_ADJ"
    rf'\b{_GROUP_NOUNS}\s+(?:are|is|were|was)\s+(?:so\s+|very\s+|really\s+|all\s+|just\s+)?{_EVAL_ADJECTIVE}',
    # "people from X", "those who", "people like X"
    r'\bpeople\s+from\s+\w+',
    r'\bthose\s+who\b',
    r'\bpeople\s+like\s+\w+',
    r'\bthe\s+\w+\s+community\b',
    r'\b\w+\s+society\b',
    r'\b\w+\s+culture\b',
    # Broad stats: "most/many/the majority of GROUP"
    rf'\b(?:most|many|the\s+majority\s+of)\s+{_GROUP_NOUNS}',
]

_GENERALIZATION_EXPLANATION = (
    "Makes a broad statement about a group without citing evidence within the text."
)

# ---------------------------------------------------------------------------
# STEREOTYPING / GROUP TARGETING
# ---------------------------------------------------------------------------
_STEREOTYPE_PATTERNS = [
    # Gender
    r'\bwomen\s+are\s+(?:not\s+)?good\s+at\b',
    r'\bmen\s+are\s+(?:naturally\s+)?better\b',
    r"\bgirls?\s+can'?t\b",
    r"\bboys?\s+don'?t\b",
    r'\bfemale\s+\w+\b',
    r'\bmale\s+\w+\b',
    # Ethnic/national — broad pattern "[word] people are"
    rf'\b\w+\s+people\s+are\s+{_EVAL_ADJECTIVE}',
    # Age
    r'\bold\s+people\s+are\b',
    r'\byoung\s+people\s+always\b',
    r'\bmillennials?\s+are\s+all\b',
    r'\bboomers?\s+are\b',
    # Class
    r'\brich\s+people\s+are\s+always\b',
    r"\bpoor\s+people\s+don'?t\b",
    r'\bworking[\s-]class\s+people\b',
]

_STEREOTYPE_EXPLANATION = (
    "Associates a trait or role with a demographic group. Such generalisations "
    "have high false-positive risk and warrant careful review."
)
_STEREOTYPE_SUGGESTION = (
    "Consider rephrasing to refer to specific individuals or add qualification: "
    "\"Some individuals who...\" or \"Research suggests some...\""
)

# ---------------------------------------------------------------------------
# HEDGE WORDS used to detect one-sided framing
# ---------------------------------------------------------------------------
_HEDGE_PHRASES = [
    r'\bhowever\b', r'\bbut\b', r'\balthough\b', r'\bdespite\b',
    r'\bwhile\b', r'\bon the other hand\b', r'\bsome argue\b',
    r'\bothers believe\b', r'\bit could be argued\b', r'\bsome suggest\b',
    r'\bit is possible\b', r'\bperhaps\b', r'\bmight\b', r'\bcould\b',
]

_ONE_SIDED_EXPLANATION = (
    "The text presents a single perspective without acknowledging counterpoints "
    "or uncertainty. This may be appropriate for the context — it's a prompt "
    "for review, not a finding of bias."
)

# ---------------------------------------------------------------------------
# TONE — indicator word lists
# ---------------------------------------------------------------------------
_WARMTH_WORDS = {'we', 'our', 'you', 'your', 'together', 'help', 'support', 'care'}
_URGENCY_WORDS = {'must', 'urgent', 'immediately', 'critical', 'now', 'deadline', 'asap'}
_URGENCY_PHRASES = [r'\bright\s+away\b']
_AGGRESSION_WORDS = {'attack', 'destroy', 'stupid', 'idiot', 'moron', 'hate', 'pathetic', 'disgusting'}

# ---------------------------------------------------------------------------
# CONFIDENCE ordering for halving logic
# ---------------------------------------------------------------------------
_CONF_ORDER = {'low': 0, 'medium': 1, 'high': 2}
_CONF_DOWN = {'high': 'medium', 'medium': 'low', 'low': 'low'}


def _halve_confidence(conf):
    """Step confidence down by one level."""
    return _CONF_DOWN.get(conf, 'low')


# ---------------------------------------------------------------------------
# QUOTATION RANGE DETECTION
# ---------------------------------------------------------------------------

def _quoted_ranges(text):
    """Return list of (start, end) ranges that fall inside quotation marks."""
    ranges = []
    for m in re.finditer(r'["\u201c\u2018](.+?)["\u201d\u2019]', text, re.DOTALL):
        ranges.append((m.start(), m.end()))
    return ranges


def _in_quotes(start, end, quoted_ranges):
    for qs, qe in quoted_ranges:
        if start >= qs and end <= qe:
            return True
    return False


# ---------------------------------------------------------------------------
# NEGATION CONTEXT CHECK
# ---------------------------------------------------------------------------

def _has_preceding_negation(text, match_start):
    """Check if the word immediately before match_start is a negation word."""
    before = text[:match_start].rstrip()
    last_word = before.split()[-1].lower().strip(".,!?;:'\"") if before.split() else ''
    return last_word in _NEGATION_WORDS


# ---------------------------------------------------------------------------
# BIAS DETECTION
# ---------------------------------------------------------------------------

def _find_surrounding_sentence(text, start, end, sentences):
    """Find the full sentence containing the flagged character span."""
    for s in sentences:
        idx = text.find(s)
        if idx != -1 and idx <= start and (idx + len(s)) >= end:
            return s
    left = max(0, start - 40)
    right = min(len(text), end + 40)
    return text[left:right].strip()


def _detect_loaded_language(text, quoted_ranges, sentences):
    findings = []
    for pattern, base_conf, suggestion in _LOADED_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            span_text = m.group(0)
            start, end = m.start(), m.end()
            conf = base_conf
            explanation = _LOADED_EXPLANATION
            weight = 4.5 if base_conf == 'high' else 3.5

            # Negation check
            if _has_preceding_negation(text, start):
                conf = 'low'
                weight = 2.0
                explanation += " (Note: preceded by negation — this may not apply)."

            # Quotation check
            if _in_quotes(start, end, quoted_ranges):
                conf = _halve_confidence(conf)
                weight = weight * 0.5
                explanation += (
                    " (Note: this is inside a quotation and may reflect the "
                    "quoted speaker's words, not the author's)."
                )

            findings.append({
                'category': 'loaded_language',
                'span': span_text,
                'start': start,
                'end': end,
                'explanation': explanation,
                'confidence': conf,
                'suggestion': suggestion,
                'surrounding_sentence': _find_surrounding_sentence(text, start, end, sentences),
                'observation': f"Emotive or absolute marker '{span_text}' detected in context.",
                'justification': "Emotionally charged adjectives and absolute quantifiers prime the reader toward an affective judgment rather than factual analysis.",
                'weight': round(weight, 1),
            })
    return findings


def _detect_generalizations(text, quoted_ranges, sentences):
    findings = []
    for pattern in _GENERALIZATION_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            span_text = m.group(0)
            start, end = m.start(), m.end()
            conf = 'medium'
            weight = 6.0
            explanation = _GENERALIZATION_EXPLANATION

            if _has_preceding_negation(text, start):
                conf = 'low'
                weight = 3.0
                explanation += " (Note: preceded by negation — this may not apply)."

            if _in_quotes(start, end, quoted_ranges):
                conf = _halve_confidence(conf)
                weight = weight * 0.5
                explanation += (
                    " (Note: this is inside a quotation and may reflect the "
                    "quoted speaker's words, not the author's)."
                )

            findings.append({
                'category': 'unsupported_generalization',
                'span': span_text,
                'start': start,
                'end': end,
                'explanation': explanation,
                'confidence': conf,
                'suggestion': "Qualify statement with specific evidence or subset bounds",
                'surrounding_sentence': _find_surrounding_sentence(text, start, end, sentences),
                'observation': f"Broad categorical assertion '{span_text}' asserts a universal predicate.",
                'justification': "Overextended generalizations omit exceptions, extrapolating traits from an unverified subset to an entire demographic or subject population.",
                'weight': round(weight, 1),
            })
    return findings


def _detect_stereotyping(text, quoted_ranges, sentences):
    findings = []
    for pattern in _STEREOTYPE_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            span_text = m.group(0)
            start, end = m.start(), m.end()
            conf = 'high'
            weight = 9.0
            explanation = _STEREOTYPE_EXPLANATION

            if _has_preceding_negation(text, start):
                conf = 'low'
                weight = 4.5
                explanation += " (Note: preceded by negation — this may not apply)."

            if _in_quotes(start, end, quoted_ranges):
                conf = _halve_confidence(conf)
                weight = weight * 0.5
                explanation += (
                    " (Note: this is inside a quotation and may reflect the "
                    "quoted speaker's words, not the author's)."
                )

            findings.append({
                'category': 'stereotyping',
                'span': span_text,
                'start': start,
                'end': end,
                'explanation': explanation,
                'confidence': conf,
                'suggestion': _STEREOTYPE_SUGGESTION,
                'surrounding_sentence': _find_surrounding_sentence(text, start, end, sentences),
                'observation': f"Demographic attribution pattern '{span_text}' associates collective traits with identity.",
                'justification': "Attributing uniform capabilities or psychological traits to gender, age, class, or ethnic groups carries a severe risk of prejudice and exclusionary bias.",
                'weight': round(weight, 1),
            })
    return findings


def _detect_one_sided_framing(text, polarity, sentences):
    """Flag when no hedge words exist, text > 100 chars, and polarity is extreme."""
    if len(text) <= 100:
        return []
    if not (-0.5 > polarity or polarity > 0.5):
        return []
    # Check for any hedge phrase
    for hp in _HEDGE_PHRASES:
        if re.search(hp, text, re.IGNORECASE):
            return []
    # Flag at document level (start=0, end=len)
    return [{
        'category': 'one_sided_framing',
        'span': text[:80] + ('...' if len(text) > 80 else ''),
        'start': 0,
        'end': len(text),
        'explanation': _ONE_SIDED_EXPLANATION,
        'confidence': 'low',
        'suggestion': "Introduce qualifying hedges (e.g. 'While some argue... others note...') to reflect nuance.",
        'surrounding_sentence': text[:140] + ('...' if len(text) > 140 else ''),
        'observation': "Monolithic discourse without counterpoint hedges, despite highly polarized sentiment.",
        'justification': "Excluding counter-arguments or alternative interpretations leads to confirmation bias, presenting contentious claims as settled consensus.",
        'weight': 6.5,
    }]


def _deduplicate_findings(findings):
    """Remove exact duplicate (category, start, end) triples, keep first."""
    seen = set()
    result = []
    for f in findings:
        key = (f['category'], f['start'], f['end'])
        if key not in seen:
            seen.add(key)
            result.append(f)
    return result


# ---------------------------------------------------------------------------
# TONE ANALYSIS
# ---------------------------------------------------------------------------

def _analyze_tone(text, word_list):
    """
    Returns a dict with formality, warmth, urgency, aggression (all 0-1 ratios)
    and a label string.
    """
    total = max(len(word_list), 1)

    # Warmth
    warmth_count = sum(1 for w in word_list if w.lower() in _WARMTH_WORDS)

    # Urgency
    urgency_count = sum(1 for w in word_list if w.lower() in _URGENCY_WORDS)
    for phrase in _URGENCY_PHRASES:
        urgency_count += len(re.findall(phrase, text, re.IGNORECASE))

    # Aggression
    agg_count = sum(1 for w in word_list if w.lower() in _AGGRESSION_WORDS)

    # Formality signals: long words (>8 chars), passive voice, sentence-ending periods
    long_word_count = sum(1 for w in word_list if len(w) > 8)
    passive_count = len(re.findall(
        r'\b(?:is|are|was|were|been|be)\s+\w+ed\b', text, re.IGNORECASE
    ))
    formal_count = long_word_count + passive_count

    warmth = min(warmth_count / total, 1.0)
    urgency = min(urgency_count / total, 1.0)
    aggression = min(agg_count / total, 1.0)
    formality = min(formal_count / total, 1.0)

    # Label: pick dominant signal
    scores = {
        'Formal': formality,
        'Aggressive': aggression,
        'Empathetic': warmth,
        'Urgent': urgency,
    }
    label = max(scores, key=scores.get)
    # If no signal is clearly dominant, call it Conversational or Neutral
    if scores[label] < 0.05:
        label = 'Neutral'
    elif label == 'Empathetic' and warmth > 0.05:
        label = 'Empathetic'
    elif label == 'Formal' and formality > 0.05:
        label = 'Formal'

    return {
        'formality': round(formality, 4),
        'warmth': round(warmth, 4),
        'urgency': round(urgency, 4),
        'label': label,
    }


# ---------------------------------------------------------------------------
# READABILITY
# ---------------------------------------------------------------------------

def _analyze_readability(text, word_list, sentences):
    word_count = len(word_list)
    sentence_count = max(len(sentences), 1)
    avg_sentence_length = word_count / sentence_count
    avg_word_length = (
        sum(len(w) for w in word_list) / max(len(word_list), 1)
    )

    # Syllable approximation
    total_syllables = sum(_count_syllables(w) for w in word_list)
    syllables_per_word = total_syllables / max(word_count, 1)

    flesch = 206.835 - (1.015 * avg_sentence_length) - (84.6 * syllables_per_word)
    flesch = round(max(0.0, min(100.0, flesch)), 2)

    if flesch > 70:
        grade = 'Simple'
    elif flesch > 50:
        grade = 'Standard'
    elif flesch > 30:
        grade = 'Academic'
    else:
        grade = 'Complex'

    return {
        'avg_sentence_length': round(avg_sentence_length, 2),
        'avg_word_length': round(avg_word_length, 2),
        'flesch_score': flesch,
        'grade_level': grade,
        'sentence_count': len(sentences),
        'word_count': word_count,
    }


# ---------------------------------------------------------------------------
# REWRITE SUGGESTION
# ---------------------------------------------------------------------------

def _build_rewrite(text, findings):
    """
    Apply span-level suggestions for loaded_language findings and append a hedge
    if one_sided_framing was flagged. Returns None if no changes would be made.
    """
    if not findings:
        return None

    rewrite = text
    offset = 0  # tracks character shift as we do replacements

    # Only apply span replacements for loaded_language with a non-null suggestion
    loaded = sorted(
        [f for f in findings if f['category'] == 'loaded_language' and f['suggestion']],
        key=lambda f: f['start']
    )
    for f in loaded:
        adj_start = f['start'] + offset
        adj_end = f['end'] + offset
        old_span = rewrite[adj_start:adj_end]
        new_span = f['suggestion']
        rewrite = rewrite[:adj_start] + new_span + rewrite[adj_end:]
        offset += len(new_span) - len(old_span)

    # Hedge for one-sided framing
    has_one_sided = any(f['category'] == 'one_sided_framing' for f in findings)
    if has_one_sided:
        rewrite = rewrite.rstrip() + " That said, different perspectives exist on this topic."

    # Return None if the rewrite is identical to original
    if rewrite.strip() == text.strip():
        return None
    return rewrite


def _calculate_footprint(text, findings, polarity, subjectivity, word_count):
    """
    Computes linguistic bias footprint metrics, radar axis scores,
    and category percentage distributions to justify the analysis results.
    """
    cats = {
        'loaded_language': 0,
        'unsupported_generalization': 0,
        'stereotyping': 0,
        'one_sided_framing': 0,
    }
    total_weight = 0.0
    for f in findings:
        cat = f.get('category')
        if cat in cats:
            cats[cat] += 1
        total_weight += f.get('weight', 4.0)

    words = max(word_count, 1)
    finding_density = len(findings) / words

    raw_index = (finding_density * 350) + (abs(polarity) * 20) + (subjectivity * 20) + (cats['stereotyping'] * 15)
    bias_index = min(100.0, round(raw_index, 1))

    if bias_index < 18:
        rating = "Low / Objective"
        badge_color = "emerald"
    elif bias_index < 45:
        rating = "Mild Linguistic Skew"
        badge_color = "blue"
    elif bias_index < 75:
        rating = "Moderate Bias Footprint"
        badge_color = "amber"
    else:
        rating = "High Bias Footprint"
        badge_color = "red"

    total_f = max(len(findings), 1)
    radar = {
        'emotional_loading': min(100, round((cats['loaded_language'] / total_f) * 60 + abs(polarity) * 40, 1)),
        'overgeneralization': min(100, round((cats['unsupported_generalization'] / total_f) * 80 + (25 if cats['unsupported_generalization'] > 0 else 0), 1)),
        'demographic_attribution': min(100, round(cats['stereotyping'] * 45, 1)),
        'framing_imbalance': min(100, round(85 if cats['one_sided_framing'] > 0 else abs(polarity) * 40, 1)),
        'subjectivity': min(100, round(subjectivity * 100, 1)),
    }

    distribution = {}
    for c, cnt in cats.items():
        distribution[c] = round((cnt / total_f) * 100, 1) if len(findings) > 0 else 0

    return {
        'bias_index': bias_index,
        'neutrality_rating': rating,
        'badge_color': badge_color,
        'category_counts': cats,
        'category_distribution': distribution,
        'radar': radar,
        'total_findings': len(findings),
        'word_count': word_count,
        'evidence_density_pct': min(100.0, round((len(findings) / words) * 100, 2)),
    }


# ---------------------------------------------------------------------------
# MAIN ENTRY POINT
# ---------------------------------------------------------------------------

def analyze_text(text):
    """
    Analyse the given text and return a comprehensive dict:

      {
        "sentiment": str,
        "polarity": float,
        "subjectivity": float,
        "findings": [...],
        "footprint": {...},
        "tone": {...},
        "readability": {...},
        "rewrite": str|None,
      }
    """
    # --- TextBlob sentiment ---
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    if polarity > 0:
        sentiment = 'Positive'
    elif polarity < 0:
        sentiment = 'Negative'
    else:
        sentiment = 'Neutral'

    # --- Tokenise ---
    sentences = _sent_tokenize(text)
    word_list = _words(text)

    # --- Quoted ranges ---
    quoted_ranges = _quoted_ranges(text)

    # --- Bias findings ---
    findings = []
    findings.extend(_detect_loaded_language(text, quoted_ranges, sentences))
    findings.extend(_detect_generalizations(text, quoted_ranges, sentences))
    findings.extend(_detect_stereotyping(text, quoted_ranges, sentences))
    findings.extend(_detect_one_sided_framing(text, polarity, sentences))
    findings = _deduplicate_findings(findings)

    # Sort by position in text (one_sided_framing goes last naturally)
    findings.sort(key=lambda f: f['start'])

    # --- Tone ---
    tone = _analyze_tone(text, word_list)

    # --- Readability ---
    readability = _analyze_readability(text, word_list, sentences)

    # --- Footprint metrics ---
    footprint = _calculate_footprint(text, findings, polarity, subjectivity, len(word_list))

    # --- Rewrite ---
    rewrite = _build_rewrite(text, findings)

    return {
        'sentiment': sentiment,
        'polarity': round(polarity, 4),
        'subjectivity': round(subjectivity, 4),
        'findings': findings,
        'footprint': footprint,
        'tone': tone,
        'readability': readability,
        'rewrite': rewrite,
    }
