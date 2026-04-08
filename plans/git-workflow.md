# VibeFinance - Git Workflow & Best Practices

## 🌳 Branch Strategy

### Main Branches

```
main (production)
  └── develop (integration)
       ├── feature/auth
       ├── feature/portfolio
       ├── feature/dashboard
       └── feature/api-integration
```

### Branch Types

| Branch Type | Naming | Purpose | Example |
|------------|---------|---------|---------|
| **Main** | `main` | Production-ready code | `main` |
| **Develop** | `develop` | Integration branch | `develop` |
| **Feature** | `feature/name` | New features | `feature/portfolio-management` |
| **Bugfix** | `bugfix/name` | Bug fixes | `bugfix/chart-rendering` |
| **Hotfix** | `hotfix/name` | Urgent production fixes | `hotfix/auth-error` |
| **Release** | `release/version` | Release preparation | `release/v1.0.0` |

---

## 📝 Commit Message Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code formatting (no logic change)
- **refactor:** Code restructuring
- **perf:** Performance improvements
- **test:** Adding tests
- **chore:** Build/tooling changes
- **revert:** Revert previous commit

### Examples

#### Good Commits ✅
```bash
feat(auth): add Google OAuth login

- Integrate Supabase Google provider
- Add OAuth callback handling
- Update login page UI

Closes #12
```

```bash
fix(portfolio): correct total value calculation

Fixed rounding error in portfolio value calculation
that was causing discrepancies in displayed totals.

Fixes #45
```

```bash
refactor(api): extract Polygon client to separate module

Improved code organization by moving API client logic
to dedicated module for better maintainability.
```

#### Bad Commits ❌
```bash
update stuff
```

```bash
fix bug
```

```bash
WIP
```

---

## 🔄 Workflow Steps

### 1. Start New Feature

```bash
# Ensure you're on develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/portfolio-management

# Work on feature...
# Make commits as you go
```

### 2. Make Commits

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat(portfolio): add create portfolio form"

# Push to remote
git push origin feature/portfolio-management
```

### 3. Keep Branch Updated

```bash
# Regularly sync with develop
git checkout develop
git pull origin develop

git checkout feature/portfolio-management
git rebase develop

# Resolve conflicts if any
# Continue rebase
git rebase --continue

# Force push (after rebase)
git push origin feature/portfolio-management --force-with-lease
```

### 4. Create Pull Request

1. Push branch to GitHub
2. Go to GitHub repository
3. Click "New Pull Request"
4. Select base: `develop`, compare: `feature/portfolio-management`
5. Fill in PR template
6. Request review
7. Wait for CI checks
8. Address feedback
9. Merge when approved

### 5. Merge to Develop

```bash
# After PR approval
# Squash and merge on GitHub

# Locally, clean up
git checkout develop
git pull origin develop
git branch -d feature/portfolio-management
```

### 6. Release to Production

```bash
# Create release branch
git checkout develop
git checkout -b release/v1.0.0

# Update version numbers, changelog
# Test thoroughly

# Merge to main
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.0.0
git branch -d release/v1.0.0
```

---

## 🚨 Hotfix Workflow

```bash
# Critical bug in production!
git checkout main
git checkout -b hotfix/auth-crash

# Fix the bug
git add .
git commit -m "hotfix(auth): prevent crash on null user"

# Merge to main
git checkout main
git merge hotfix/auth-crash
git tag -a v1.0.1 -m "Hotfix: auth crash"
git push origin main --tags

# Merge to develop
git checkout develop
git merge hotfix/auth-crash

# Clean up
git branch -d hotfix/auth-crash
```

---

## 📋 Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Screenshots (if applicable)
Add screenshots here

## Testing
- [ ] I have tested these changes locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] All new and existing tests pass

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] No console.log statements left in code
```

---

## 🎯 Best Practices

### Do's ✅

1. **Commit Early, Commit Often**
   - Small, focused commits
   - Easier to review and revert

2. **Write Descriptive Messages**
   - Clear subject line
   - Detailed body when needed

3. **Keep Branches Short-Lived**
   - Merge frequently
   - Reduce merge conflicts

4. **Test Before Pushing**
   - Run `npm run build`
   - Check for errors

5. **Review Your Own Code First**
   - `git diff` before commit
   - Catch mistakes early

6. **Use .gitignore Properly**
   - Never commit secrets
   - Exclude build artifacts

### Don'ts ❌

1. **Don't Commit to Main Directly**
   - Always use feature branches
   - Protect main branch

2. **Don't Commit Secrets**
   - No API keys
   - No passwords
   - Use environment variables

3. **Don't Leave Debug Code**
   - Remove console.logs
   - Remove commented code

4. **Don't Force Push to Shared Branches**
   - Use `--force-with-lease`
   - Only on your own branches

5. **Don't Mix Unrelated Changes**
   - One feature per branch
   - Keep commits focused

---

## 🔐 .gitignore

Essential entries for VibeFinance:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
dist-ssr/

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Temporary
.cache/
.temp/
*.tmp

# Build
.vite/
*.tsbuildinfo
```

---

## 🏷️ Tagging Strategy

### Version Format
```
v<major>.<minor>.<patch>
```

Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - New feature
- `v1.1.1` - Bug fix

### Creating Tags
```bash
# Lightweight tag
git tag v1.0.0

# Annotated tag (recommended)
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin --tags

# Delete tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

---

## 🛠️ Useful Git Commands

### Undo Changes
```bash
# Undo unstaged changes
git checkout -- <file>

# Undo staged changes
git reset HEAD <file>

# Undo last commit (keep changes)
git reset --soft HEAD^

# Undo last commit (discard changes)
git reset --hard HEAD^
```

### View History
```bash
# Pretty log
git log --oneline --graph --decorate --all

# Changes in file
git log -p <file>

# Who changed what
git blame <file>
```

### Clean Up
```bash
# Remove untracked files (dry run)
git clean -n

# Remove untracked files
git clean -f

# Remove untracked directories
git clean -fd
```

### Stash Changes
```bash
# Stash changes
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Pop stash
git stash pop

# Drop stash
git stash drop
```

---

## 🚀 CI/CD Integration

### GitHub Actions (Future)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Build
        run: npm run build
```

---

## 📊 Git Aliases (Optional)

Add to `~/.gitconfig`:

```ini
[alias]
  st = status
  co = checkout
  br = branch
  ci = commit
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --oneline --graph --decorate --all
  amend = commit --amend --no-edit
```

Usage:
```bash
git st          # git status
git co develop  # git checkout develop
git visual      # pretty log
```

---

## 🎓 Learning Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://sethrobertson.github.io/GitBestPractices/)

---

**Last Updated:** 2026-04-08  
**Status:** Git workflow guide complete
