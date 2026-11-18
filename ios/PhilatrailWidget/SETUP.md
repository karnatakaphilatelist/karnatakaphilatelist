# PhilatrailWidget — Xcode Setup

The Swift source is ready. Follow these steps in Xcode once to wire it up:

## 1. Add the Widget Extension target

1. File → New → Target → Widget Extension
2. Product Name: `PhilatrailWidget`
3. Bundle Identifier: `app.vinvi.philatrail.widget`
4. **Uncheck** "Include Configuration App Intent" (we use Static configuration)
5. Finish → Activate scheme

## 2. Replace generated files

Delete the stub files Xcode generated and use the ones in this directory:
- `PhilatrailWidget.swift` — the full widget implementation

## 3. Add App Group capability (required for data sharing)

Do this for **both** the main app target **and** the widget extension target:

1. Select the target in Xcode → Signing & Capabilities
2. + Capability → App Groups
3. Add group: `group.app.vinvi.philatrail`

This matches the `appGroupID` constant in both Swift files.

## 4. Add PhilatrailPlugin to the main App target

Add these two files to the **App** target (not the widget):
- `App/PhilatrailSharedStore.swift`
- `App/PhilatrailPlugin.swift`

Then register the plugin in `capacitor.config.ts` (already done):
```ts
plugins: {
  Philatrail: {}
}
```

## 5. Widget preview

Build and run on a simulator. Long-press the home screen → + → Philatrail → choose Small or Medium.

The widget reads from App Group UserDefaults. It shows "0 / 158" on first launch (before any visits), and updates immediately when the app stamps a post office.

## 6. App Store notes

The widget satisfies Apple's guideline 4.2 (Minimum Functionality) requirement for a clearly native feature. It is functionally distinct from the web view — it reads from a shared container written by native Swift code and renders entirely in SwiftUI without any web content.
