//
//  PhilatrailPlugin.swift
//  Philatrail
//
//  Capacitor plugin that exposes native iOS features to the web layer.
//  Currently provides one call:
//
//    Capacitor.Plugins.Philatrail.updateWidget({ stampsKA, stampsKATotal, stampsTN, stampsTNTotal })
//
//  Called by src/lib/widget.ts whenever the visit count changes.
//

import Capacitor
import Foundation

@objc(PhilatrailPlugin)
public class PhilatrailPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PhilatrailPlugin"
    public let jsName = "Philatrail"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidget", returnType: CAPPluginReturnPromise)
    ]

    /// Updates the home-screen widget with current stamp counts.
    @objc func updateWidget(_ call: CAPPluginCall) {
        let stampsKA    = call.getInt("stampsKA")    ?? 0
        let totalKA     = call.getInt("stampsKATotal") ?? 100
        let stampsTN    = call.getInt("stampsTN")    ?? 0
        let totalTN     = call.getInt("stampsTNTotal") ?? 58

        PhilatrailSharedStore.updateProgress(
            stampsKA: stampsKA, stampsKATotal: totalKA,
            stampsTN: stampsTN, stampsTNTotal: totalTN
        )
        call.resolve()
    }
}
