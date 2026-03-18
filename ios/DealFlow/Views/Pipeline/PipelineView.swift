import SwiftUI

struct PipelineView: View {
    @StateObject private var vm = AppViewModel.shared
    @State private var showAddDeal = false
    @State private var movingDeal: Deal? = nil
    @State private var errorMessage: String? = nil

    var body: some View {
        NavigationStack {
            ZStack {
                Color.dealflowBackground.ignoresSafeArea()

                if vm.isLoading && vm.deals.isEmpty {
                    ProgressView("Loading pipeline...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(alignment: .top, spacing: 16) {
                            ForEach(DealStage.allCases) { stage in
                                StageColumn(
                                    stage: stage,
                                    deals: vm.dealsByStage[stage] ?? [],
                                    onStageChange: { deal, newStage in
                                        Task { await moveToStage(deal: deal, stage: newStage) }
                                    }
                                )
                            }
                        }
                        .padding()
                    }
                    .refreshable { await vm.fetchDeals() }
                }

                if let error = errorMessage {
                    VStack {
                        Spacer()
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.red.opacity(0.9))
                            .cornerRadius(10)
                            .padding()
                    }
                }
            }
            .navigationTitle("Pipeline")
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
        }
    }

    private func moveToStage(deal: Deal, stage: DealStage) async {
        do {
            try await vm.updateStage(dealId: deal.id, stage: stage)
        } catch {
            errorMessage = error.localizedDescription
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                errorMessage = nil
            }
        }
    }
}

// MARK: - Stage Column
struct StageColumn: View {
    let stage: DealStage
    let deals: [Deal]
    var onStageChange: ((Deal, DealStage) -> Void)? = nil

    private var totalAmount: Double {
        deals.compactMap { $0.raiseAmount }.reduce(0, +)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Column Header
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Circle()
                        .fill(stage.color)
                        .frame(width: 10, height: 10)
                    Text(stage.rawValue)
                        .font(.subheadline.bold())
                        .foregroundColor(.primary)
                    Spacer()
                    Text("\(deals.count)")
                        .font(.caption.bold())
                        .foregroundColor(.white)
                        .frame(minWidth: 20)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(stage.color)
                        .cornerRadius(10)
                }
                if totalAmount > 0 {
                    Text(totalAmount.formattedAsCurrency())
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 12)
            .padding(.bottom, 8)
            .background(stage.color.opacity(0.08))
            .cornerRadius(12, corners: [.topLeft, .topRight])

            // Cards
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 10) {
                    ForEach(deals) { deal in
                        NavigationLink(destination: DealDetailView(deal: deal)) {
                            DealCardView(deal: deal, onStageTap: { newStage in
                                onStageChange?(deal, newStage)
                            })
                        }
                        .buttonStyle(PlainButtonStyle())
                    }

                    if deals.isEmpty {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color(.systemGray6))
                            .frame(width: 200, height: 60)
                            .overlay(
                                Text("No deals")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            )
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 12)
            }
            .frame(height: UIScreen.main.bounds.height - 220)
        }
        .background(stage.color.opacity(0.04))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(stage.color.opacity(0.2), lineWidth: 1)
        )
        .frame(width: 224)
    }
}

// MARK: - Corner radius extension
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCornerShape(radius: radius, corners: corners))
    }
}

struct RoundedCornerShape: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect,
                                byRoundingCorners: corners,
                                cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

#Preview {
    PipelineView()
}
