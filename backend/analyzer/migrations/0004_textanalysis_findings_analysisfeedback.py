# Generated migration for Unbiasify analyzer app
# Adds findings JSONField to TextAnalysis and creates AnalysisFeedback model.
# Depends on 0003_passwordresettoken.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analyzer', '0003_passwordresettoken'),
    ]

    operations = [
        # 1. Add findings JSONField to TextAnalysis
        migrations.AddField(
            model_name='textanalysis',
            name='findings',
            field=models.JSONField(blank=True, default=dict),
        ),

        # 2. Create AnalysisFeedback model
        migrations.CreateModel(
            name='AnalysisFeedback',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'analysis',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='feedbacks',
                        to='analyzer.textanalysis',
                    ),
                ),
                ('finding_index', models.IntegerField()),
                ('feedback_type', models.CharField(max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
    ]
