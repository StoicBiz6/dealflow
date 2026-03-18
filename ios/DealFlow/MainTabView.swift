import SwiftUI

struct MainTabView: View {
    @StateObject private var vm = AppViewModel.shared

    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "house.fill")
                }

            PipelineView()
                .tabItem {
                    Label("Pipeline", systemImage: "chart.bar.xaxis")
                }

            NavigationStack {
                DealListView()
            }
            .tabItem {
                Label("Deals", systemImage: "folder.fill")
            }

            NavigationStack {
                TasksView()
            }
            .tabItem {
                Label("Tasks", systemImage: "checklist")
            }

            NewsView()
                .tabItem {
                    Label("Intelligence", systemImage: "newspaper")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(.dealflowBlue)
    }
}

#Preview {
    MainTabView()
}
