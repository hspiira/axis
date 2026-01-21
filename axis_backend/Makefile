.PHONY: help security-scan security-full test lint format

help:
	@echo "Available commands:"
	@echo "  make security-scan    - Run quick security scans (bandit + safety)"
	@echo "  make security-full    - Run comprehensive security scans"
	@echo "  make test             - Run Django tests"
	@echo "  make lint             - Run code linting"
	@echo "  make format           - Format code with black"

security-scan:
	@echo "🔍 Running security scans..."
	@echo "\n📋 1/2: Bandit - Code security analysis"
	@bandit -r . -c .bandit.yml || true
	@echo "\n🔒 2/2: Safety - Dependency vulnerability check"
	@safety check --file=requirements.txt || true
	@echo "\n✅ Security scan complete!"

security-full:
	@echo "🔍 Running comprehensive security scans..."
	@echo "\n📋 1/4: Bandit - Code security analysis"
	@bandit -r . -c .bandit.yml -f json -o reports/bandit-report.json || true
	@bandit -r . -c .bandit.yml
	@echo "\n🔒 2/4: Safety - Dependency vulnerability check"
	@safety check --file=requirements.txt --output=json > reports/safety-report.json || true
	@safety check --file=requirements.txt
	@echo "\n🔐 3/4: Pip-audit - OSV vulnerability database check"
	@pip-audit --format=json --output=reports/pip-audit-report.json || true
	@pip-audit
	@echo "\n🛡️  4/4: Semgrep - SAST analysis"
	@semgrep --config=auto --json --output=reports/semgrep-report.json . || true
	@semgrep --config=auto .
	@echo "\n✅ Comprehensive security scan complete! Check reports/ directory."

test:
	@echo "🧪 Running Django tests..."
	@python manage.py test

lint:
	@echo "🔍 Running linters..."
	@flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	@flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

format:
	@echo "🎨 Formatting code with black..."
	@black .

install-security-tools:
	@echo "📦 Installing security scanning tools..."
	@pip install bandit[toml] safety pip-audit semgrep
	@echo "✅ Security tools installed!"

create-reports-dir:
	@mkdir -p reports
