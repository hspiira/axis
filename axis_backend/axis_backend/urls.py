"""
URL configuration for axis_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),

    # API Endpoints
    path("api/auth/", include("apps.authentication.urls")),
    path("api/", include("apps.persons.urls")),
    path("api/", include("apps.documents.urls")),
    path("api/", include("apps.kpis.urls")),
    path("api/", include("apps.audit.urls")),
    path("api/", include("apps.clients.urls")),
    path("api/", include("apps.contracts.urls")),
]

# Debug toolbar (only in development)
if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]
