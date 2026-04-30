# RevenueCat Configuration Checklist

## Prerequisites
- [ ] RevenueCat account created: https://app.revenuecat.com
- [ ] iOS app created in Apple Developer
- [ ] App Store subscription products created
- [ ] Bundle ID matches `app.json`

## Dashboard Configuration
- [ ] Project created for MySky
- [ ] iOS platform configured
- [ ] Products linked to App Store subscription IDs
- [ ] Entitlement created: `deeper_sky`
- [ ] Offering created and set as default
- [ ] Monthly and annual packages linked to `deeper_sky`

## API Keys
- [ ] iOS public SDK key starts with `appl_`
- [ ] Android public SDK key starts with `goog_`, if Android is enabled
- [ ] EAS secret set:

```bash
eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --scope project --value appl_xxxxx
```

## Local Development
```bash
export EXPO_PUBLIC_REVENUECAT_ALLOW_DEV_BUNDLE=true
npm run dev:light
```

## TestFlight Verification
- [ ] Build with preview profile
- [ ] Submit to TestFlight
- [ ] Purchase with an Apple sandbox tester
- [ ] Confirm RevenueCat shows the active customer entitlement
- [ ] Confirm the app unlocks Deeper Sky features
- [ ] Confirm restore purchases works
- [ ] Confirm Sentry receives purchase failures without PII

## Troubleshooting
- Purchases pending: check Apple sandbox status and RevenueCat customer events.
- Entitlement missing: verify the product is attached to `deeper_sky`.
- Product unavailable: verify App Store product IDs and bundle ID.
- API key rejected: verify `appl_` or `goog_` prefix and EAS secret sync.
