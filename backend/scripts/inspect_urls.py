import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django
try:
    django.setup()
    from django.urls import get_resolver
    from django.urls.resolvers import URLPattern, URLResolver
    patterns = get_resolver().url_patterns
    for p in patterns:
        print(type(p), getattr(p, 'pattern', p))
except Exception as e:
    import traceback
    traceback.print_exc()
