import SwiftUI

struct DashboardView: View {
    @StateObject private var vm = AppViewModel.shared
    @State private var showAddDeal = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.dealflowBackground.ignoresSafeArea()

                if vm.isLoading && vm.deals.isEmpty {
                    ProgressView("Loading deals...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            // KPI Cards
                            kpiSection

                            // Stale deals alert
                            if !vm.staleDeals.isEmpty {
                                staleDealsAlert
                            }

                            // Recent deals
                            recentDealsSection
                        }
                        .padding()
                    }
                    .refreshable { await vm.fetchDeals() }
                }
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showAddDeal = true }) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundColor(.dealflowBlue)
                    }
                }
            }
            .sheet(isPresented: $showAddDeal) {
                AddDealView()
            }
            .task { await vm.fetchDeals() }
        }
    }

    // MARK: - KPI Section
    private var kpiSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Overview")
                .font(.headline)
                .foregroundColor(.secondary)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                KPICard(
                    title: "Total Pipeline",
                    value: vm.totalPipeline.formattedAsCurrency(),
                    icon: "chart.bar.fill",
                    color: .dealflowBlue
                )
                KPICard(
                    title: "Active Deals",
                    value: "\(vm.activeDealsCount)",
                    icon: "folder.fill",
                    color: .orange
                )
                KPICard(
                    title: "Closed Deals",
                    value: "\(vm.closedDealsCount)",
                    icon: "checkmark.circle.fill",
                    color: .green
                )
                KPICard(
                    title: "Est. Fees",
                    value: vm.estimatedFees.formattedAsCurrency(),
                    icon: "dollarsign.circle.fill",
                    color: .purple
                )
            }
        }
    }

    // MARK: - Stale Deals Alert
    private var staleDealsAlert: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text("Stale Deals (\(vm.staleDeals.count))")
                    .font(.headline)
                    .foregroundColor(.orange)
            }

            ForEach(vm.staleDeals.prefix(3)) { deal in
                NavigationLink(destination: DealDetailView(deal: deal)) {
                    HStack {
                        Circle()
                            .fill(deal.stage.color)
                            .frame(width: 8, height: 8)
                        Text(deal.companyName)
                            .font(.subheadline)
                            .foregroundColor(.primary)
                        Spacer()
                        Text(deal.updatedAt?.relativeDate() ?? "")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding()
        .background(Color.orange.opacity(0.08))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Recent Deals
    private var recentDealsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Deals")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Spacer()
                NavigationLink("See all") {
                    DealListView()
                }
                .font(.subheadline)
                .foregroundColor(.dealflowBlue)
            }

            if vm.deals.isEmpty {
                emptyState
            } else {
                ForEach(vm.deals.prefix(8)) { deal in
                    NavigationLink(destination: DealDetailView(deal: deal)) {
                        DealRowView(deal: deal)
                    }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "briefcase")
                .font(.system(size: 48))
                .foregroundColor(.secondary.opacity(0.5))
            Text("No deals yet")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("Tap + to add your first deal")
                .font(.subheadline)
                .foregroundColor(.secondary.opacity(0.7))
            Button(action: { showAddDeal = true }) {
                Label("Add Deal", systemImage: "plus")
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.dealflowBlue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(32)
    }
}

// MARK: - KPI Card
struct KPICard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
            }
            Text(value)
                .font(.title2.bold())
                .foregroundColor(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(14)
        .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Deal Row
struct DealRowView: View {
    let deal: Deal

    var body: some View {
        HStack(spacing: 12) {
            // Stage indicator
            Circle()
                .fill(deal.stage.color)
                .frame(width: 10, height: 10)

            VStack(alignment: .leading, spacing: 3) {
                Text(deal.companyName)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                HStack(spacing: 6) {
                    if let sector = deal.sector {
                        Text(sector)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("·")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Text(deal.stage.rawValue)
                        .font(.caption)
                        .foregroundColor(deal.stage.color)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 3) {
                if let raise = deal.raiseAmount {
                    Text(raise.formattedAsCurrency())
                        .font(.subheadline.bold())
                        .foregroundColor(.primary)
                }
                if let updated = deal.updatedAt?.relativeDate() {
                    Text(updated)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 1)
    }
}

#Preview {
    DashboardView()
}
