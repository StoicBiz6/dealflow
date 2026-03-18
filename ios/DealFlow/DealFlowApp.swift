import SwiftUI

@main
struct DealFlowApp: App {
    @StateObject private var auth = AuthService.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.isSignedIn {
                    MainTabView()
                        .transition(.opacity)
                } else {
                    SignInView()
                        .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: auth.isSignedIn)
        }
    }
}
