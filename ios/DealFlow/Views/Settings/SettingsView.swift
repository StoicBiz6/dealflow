import SwiftUI

struct SettingsView: View {
    @StateObject private var auth = AuthService.shared
    @StateObject private var vm = AppViewModel.shared
    @State private var showSignOutConfirm = false

    var body: some View {
        NavigationStack {
            Form {
                // Profile Section
                Section {
                    HStack(spacing: 14) {
                        Circle()
                            .fill(Color.dealflowBlue.opacity(0.15))
                            .frame(width: 56, height: 56)
                            .overlay(
                                Text(userInitials)
                                    .font(.title2.bold())
                                    .foregroundColor(.dealflowBlue)
                            )
                        VStack(alignment: .leading, spacing: 3) {
                            Text(auth.currentUserName ?? "User")
                                .font(.headline)
                            Text(auth.currentUserEmail ?? "")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                // App Info
                Section("App") {
                    HStack {
                        Label("Version", systemImage: "info.circle")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Label("Deals", systemImage: "briefcase")
                        Spacer()
                        Text("\(vm.deals.count)")
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Label("Active Pipeline", systemImage: "chart.bar")
                        Spacer()
                        Text(vm.totalPipeline.formattedAsCurrency())
                            .foregroundColor(.secondary)
                    }
                }

                // API Configuration
                Section("Configuration") {
                    VStack(alignment: .leading, spacing: 4) {
                        Label("Supabase", systemImage: "server.rack")
                        Text(Constants.supabaseURL.contains("YOUR_PROJECT") ? "Not configured" : "Connected")
                            .font(.caption)
                            .foregroundColor(Constants.supabaseURL.contains("YOUR_PROJECT") ? .orange : .green)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        Label("Vercel API", systemImage: "cloud")
                        Text(Constants.vercelBaseURL)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                // Links
                Section("Resources") {
                    Link(destination: URL(string: "https://dealflow-zeta.vercel.app")!) {
                        Label("Open Web App", systemImage: "safari")
                    }
                    Link(destination: URL(string: "https://supabase.com/dashboard")!) {
                        Label("Supabase Dashboard", systemImage: "externaldrive")
                    }
                }

                // Sign Out
                Section {
                    Button(role: .destructive) {
                        showSignOutConfirm = true
                    } label: {
                        HStack {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                            Text("Sign Out")
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .confirmationDialog("Sign Out", isPresented: $showSignOutConfirm) {
                Button("Sign Out", role: .destructive) {
                    auth.signOut()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }

    private var userInitials: String {
        let name = auth.currentUserName ?? auth.currentUserEmail ?? "U"
        return String(name.prefix(1)).uppercased()
    }
}

#Preview {
    SettingsView()
}
