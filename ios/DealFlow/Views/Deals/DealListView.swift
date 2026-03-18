import SwiftUI

struct DealListView: View {
    @StateObject private var vm = AppViewModel.shared
    @State private var searchText = ""
    @State private var selectedStage: DealStage? = nil
    @State private var selectedSector: String? = nil
    @State private var showAddDeal = false
    @State private var showFilters = false

    private var filteredDeals: [Deal] {
        vm.deals.filter { deal in
            let matchesSearch = searchText.isEmpty ||
                deal.companyName.localizedCaseInsensitiveContains(searchText) ||
                (deal.sector?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                (deal.dealOwner?.localizedCaseInsensitiveContains(searchText) ?? false)
            let matchesStage = selectedStage == nil || deal.stage == selectedStage
            let matchesSector = selectedSector == nil || deal.sector == selectedSector
            return matchesSearch && matchesStage && matchesSector
        }
    }

    private var availableSectors: [String] {
        Array(Set(vm.deals.compactMap { $0.sector })).sorted()
    }

    var body: some View {
        ZStack {
            Color.dealflowBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                // Filter chips
                if selectedStage != nil || selectedSector != nil {
                    activeFiltersBar
                }

                List {
                    ForEach(filteredDeals) { deal in
                        NavigationLink(destination: DealDetailView(deal: deal)) {
                            DealRowView(deal: deal)
                                .listRowBackground(Color.clear)
                        }
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                    }
                    .onDelete(perform: deleteDeal)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .searchable(text: $searchText, prompt: "Search deals...")
        .navigationTitle("All Deals")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                HStack(spacing: 12) {
                    Button(action: { showFilters = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle\(selectedStage != nil || selectedSector != nil ? ".fill" : "")")
                            .foregroundColor(.dealflowBlue)
                    }
                    Button(action: { showAddDeal = true }) {
                        Image(systemName: "plus")
                            .foregroundColor(.dealflowBlue)
                    }
                }
            }
        }
        .sheet(isPresented: $showFilters) {
            FilterSheet(
                selectedStage: $selectedStage,
                selectedSector: $selectedSector,
                availableSectors: availableSectors
            )
            .presentationDetents([.medium])
        }
        .sheet(isPresented: $showAddDeal) {
            AddDealView()
        }
        .refreshable { await vm.fetchDeals() }
    }

    private var activeFiltersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if let stage = selectedStage {
                    FilterChip(label: stage.rawValue, color: stage.color) {
                        selectedStage = nil
                    }
                }
                if let sector = selectedSector {
                    FilterChip(label: sector, color: .dealflowBlue) {
                        selectedSector = nil
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
    }

    private func deleteDeal(at offsets: IndexSet) {
        let toDelete = offsets.map { filteredDeals[$0] }
        Task {
            for deal in toDelete {
                try? await vm.deleteDeal(id: deal.id)
            }
        }
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let label: String
    let color: Color
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Text(label)
                .font(.caption.bold())
                .foregroundColor(color)
            Button(action: onRemove) {
                Image(systemName: "xmark")
                    .font(.caption2.bold())
                    .foregroundColor(color)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(color.opacity(0.12))
        .cornerRadius(20)
    }
}

// MARK: - Filter Sheet
struct FilterSheet: View {
    @Binding var selectedStage: DealStage?
    @Binding var selectedSector: String?
    let availableSectors: [String]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Stage") {
                    ForEach(DealStage.allCases) { stage in
                        Button(action: {
                            selectedStage = selectedStage == stage ? nil : stage
                        }) {
                            HStack {
                                Circle()
                                    .fill(stage.color)
                                    .frame(width: 10, height: 10)
                                Text(stage.rawValue)
                                    .foregroundColor(.primary)
                                Spacer()
                                if selectedStage == stage {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.dealflowBlue)
                                }
                            }
                        }
                    }
                }

                if !availableSectors.isEmpty {
                    Section("Sector") {
                        ForEach(availableSectors, id: \.self) { sector in
                            Button(action: {
                                selectedSector = selectedSector == sector ? nil : sector
                            }) {
                                HStack {
                                    Text(sector)
                                        .foregroundColor(.primary)
                                    Spacer()
                                    if selectedSector == sector {
                                        Image(systemName: "checkmark")
                                            .foregroundColor(.dealflowBlue)
                                    }
                                }
                            }
                        }
                    }
                }

                Section {
                    Button("Clear All Filters", role: .destructive) {
                        selectedStage = nil
                        selectedSector = nil
                        dismiss()
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        DealListView()
    }
}
