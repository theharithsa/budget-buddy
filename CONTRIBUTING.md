# Contributing to FinBuddy with KautilyaAI

We welcome contributions to FinBuddy! This document provides guidelines for contributing to the project.

## 🌟 Ways to Contribute

### Code Contributions
- Bug fixes and improvements
- New features and enhancements
- KautilyaAI wisdom system improvements
- UI/UX enhancements
- Performance optimizations

### Documentation
- API documentation improvements
- User guide enhancements
- Developer documentation
- Code comments and examples

### Testing
- Unit tests
- Integration tests
- E2E tests
- Manual testing and bug reports

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ 
- Firebase CLI
- Git

### Setup Development Environment

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/budget-buddy.git
   cd budget-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

3. **Set up Firebase**
   ```bash
   # Configure Firebase CLI
   firebase login
   firebase use --add
   ```

4. **Set up environment variables**
   ```bash
   # For KautilyaAI features
   cd functions
   firebase functions:secrets:set GEMINI_API_KEY
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

### KautilyaAI Development
- Follow wisdom system patterns in `functions/src/lib/wisdom/`
- Test AI interactions thoroughly
- Maintain cultural sensitivity in Sanskrit terminology
- Document Arthashastra principle applications

### Commit Convention
```
type(scope): description

Types:
- feat: New features
- fix: Bug fixes
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Testing
- chore: Maintenance
```

Example:
```
feat(kautilyaai): add new Arthashastra principle for investment timing
fix(dashboard): resolve chart rendering issue in dark mode
docs(api): update KautilyaAI endpoint documentation
```

## 🧪 Testing

### Run Tests
```bash
npm run test:run          # All tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # E2E tests
```

### Testing KautilyaAI
```bash
npm run test:dynatrace   # AI system tests
```

## 📋 Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation

3. **Test Changes**
   ```bash
   npm run test:pre-deploy
   npm run build
   ```

4. **Submit Pull Request**
   - Provide clear description
   - Reference related issues
   - Include screenshots for UI changes

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
(If applicable)

## Related Issues
Fixes #(issue number)
```

## 🔒 Security

- Follow security guidelines in [SECURITY.md](./docs/SECURITY.md)
- Never commit sensitive data
- Report security issues responsibly
- Use Firebase secrets for API keys

## 🎯 Feature Requests

1. Check existing issues first
2. Create detailed feature request
3. Explain use case and benefits
4. Consider KautilyaAI integration opportunities

## 🐛 Bug Reports

1. Check if bug already reported
2. Provide reproduction steps
3. Include environment details
4. Add screenshots/logs if helpful

### Bug Report Template
```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce the behavior

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 2.6.0]

**Additional context**
Any other context about the problem
```

## 📚 Documentation

### User Documentation
- Located in `public/docs/`
- Focus on practical usage
- Include screenshots and examples

### Developer Documentation
- Located in `public/developer/`
- Technical implementation details
- API references and examples

### Code Documentation
- Use JSDoc for functions
- Comment complex logic
- Document KautilyaAI wisdom patterns

## 🌍 Internationalization

### Sanskrit Terms
- Maintain accuracy in Sanskrit terminology
- Provide modern interpretations
- Follow established patterns in wisdom system

### Cultural Sensitivity
- Respect Indian financial culture
- Consider regional variations
- Test with diverse user scenarios

## 📦 Release Process

### Version Management
```bash
npm run version:patch    # Bug fixes
npm run version:minor    # New features
npm run version:major    # Breaking changes
```

### Deployment
```bash
npm run build
firebase deploy
```

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

### Enforcement
- Issues will be addressed promptly
- Maintainers have final authority
- Follow GitHub community guidelines

## 📞 Getting Help

### Channels
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Pull Requests for code review

### Maintainer Response Time
- Critical issues: 24 hours
- Bug reports: 48-72 hours
- Feature requests: 1 week
- Documentation: 1 week

## 🏆 Recognition

Contributors will be recognized in:
- CHANGELOG.md for significant contributions
- README.md contributors section
- Release notes for major features

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to FinBuddy! Together we're building the future of personal finance management with ancient wisdom and modern technology.
