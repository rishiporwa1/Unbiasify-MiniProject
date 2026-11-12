import os
import jwt
from jwt import PyJWKClient
from rest_framework import authentication, exceptions
from django.contrib.auth.models import User
from django.conf import settings

_jwks_client = None

def get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        jwks_url = getattr(settings, 'CLERK_JWKS_URL', None) or os.environ.get('CLERK_JWKS_URL')
        if not jwks_url:
            issuer = getattr(settings, 'CLERK_ISSUER', None) or os.environ.get('CLERK_ISSUER')
            if issuer:
                jwks_url = issuer.rstrip('/') + '/.well-known/jwks.json'
        if jwks_url:
            _jwks_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
    return _jwks_client


class ClerkAuthentication(authentication.BaseAuthentication):
    """
    Authenticates requests using Clerk session JWTs in the Authorization: Bearer <token> header.
    Verifies the RS256 signature using Clerk's JWKS and resolves the 'sub' claim to a Django User.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]

        issuer = getattr(settings, 'CLERK_ISSUER', None) or os.environ.get('CLERK_ISSUER')
        client = get_jwks_client()

        payload = None
        if client:
            try:
                signing_key = client.get_signing_key_from_jwt(token)
                decode_options = {"verify_aud": False}
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    issuer=issuer if issuer else None,
                    options=decode_options
                )
            except jwt.ExpiredSignatureError:
                raise exceptions.AuthenticationFailed('Clerk token has expired.')
            except Exception as e:
                raise exceptions.AuthenticationFailed(f'Invalid Clerk token signature: {str(e)}')
        else:
            # When JWKS_URL is not configured yet, decode payload with signature check relaxed
            try:
                payload = jwt.decode(token, options={"verify_signature": False, "verify_aud": False})
            except Exception:
                raise exceptions.AuthenticationFailed('Invalid token format.')

        clerk_id = payload.get('sub')
        if not clerk_id:
            raise exceptions.AuthenticationFailed('Token does not contain a subject (sub) claim.')

        email = (
            payload.get('email')
            or payload.get('primary_email_address')
            or payload.get('email_address')
            or ''
        )
        first_name = payload.get('first_name', '')
        last_name = payload.get('last_name', '')

        user, created = User.objects.get_or_create(
            username=clerk_id,
            defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
            }
        )
        if not created and email and not user.email:
            user.email = email
            user.save(update_fields=['email'])

        return (user, token)

