#!/usr/bin/env python
"""
Script to verify and document object-level permissions across all ViewSets.

This script scans all ViewSets and generates a security permissions report.
"""
import os
import re
from pathlib import Path


def find_viewsets():
    """Find all ViewSet files in the project."""
    base_dir = Path(__file__).resolve().parent.parent
    viewsets = []

    for app_dir in (base_dir / 'apps').iterdir():
        if not app_dir.is_dir():
            continue

        views_dir = app_dir / 'views'
        if not views_dir.exists():
            continue

        for viewset_file in views_dir.glob('*viewset.py'):
            viewsets.append(viewset_file)

    return viewsets


def analyze_viewset(file_path):
    """Analyze a ViewSet file for security permissions."""
    with open(file_path, 'r') as f:
        content = f.read()

    # Extract ViewSet class name
    class_match = re.search(r'class\s+(\w+ViewSet)\(', content)
    class_name = class_match.group(1) if class_match else 'Unknown'

    # Check for permission imports
    has_object_permissions = any([
        'IsClientScopedOrAdmin' in content,
        'CanModifyObject' in content,
        'IsConfidentialAllowed' in content,
        'IsOwnerOrReadOnly' in content,
        'IsAdminOrManager' in content,
    ])

    # Check for permission_classes
    permission_match = re.search(r'permission_classes\s*=\s*\[(.*?)\]', content)
    permissions = permission_match.group(1) if permission_match else 'Not found'

    # Check for get_permissions method
    has_get_permissions = 'def get_permissions(' in content

    return {
        'file': file_path.name,
        'app': file_path.parent.parent.name,
        'class': class_name,
        'has_object_permissions': has_object_permissions,
        'permissions': permissions.strip(),
        'has_get_permissions': has_get_permissions,
        'status': 'SECURED' if has_object_permissions else 'NEEDS_UPDATE'
    }


def generate_report():
    """Generate security permissions report."""
    viewsets = find_viewsets()
    results = []

    print("=" * 80)
    print("VIEWSET SECURITY PERMISSIONS REPORT")
    print("=" * 80)
    print()

    for viewset_path in viewsets:
        result = analyze_viewset(viewset_path)
        results.append(result)

        status_icon = "✅" if result['status'] == 'SECURED' else "⚠️"
        print(f"{status_icon} {result['app']}.{result['class']}")
        print(f"   Permissions: {result['permissions']}")
        print(f"   Object-Level: {'Yes' if result['has_object_permissions'] else 'No'}")
        print(f"   get_permissions(): {'Yes' if result['has_get_permissions'] else 'No'}")
        print()

    # Summary
    secured_count = sum(1 for r in results if r['status'] == 'SECURED')
    total_count = len(results)

    print("=" * 80)
    print(f"SUMMARY: {secured_count}/{total_count} ViewSets have object-level permissions")
    print("=" * 80)

    if secured_count < total_count:
        print("\n⚠️  ViewSets needing updates:")
        for result in results:
            if result['status'] == 'NEEDS_UPDATE':
                print(f"  - {result['app']}.{result['class']} ({result['file']})")
    else:
        print("\n✅ All ViewSets are properly secured!")

    return results


if __name__ == '__main__':
    generate_report()
