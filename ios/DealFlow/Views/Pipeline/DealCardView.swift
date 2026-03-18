import SwiftUI

struct DealCardView: View {
    let deal: Deal
    var onStageTap: ((DealStage) -> Void)? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(deal.companyName)
                        .font(.subheadline.bold())
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    if let sector = deal.sector {
                        Text(sector)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
                Text(deal.stage.emoji)
                    .font(.title3)
            }

            Divider()

            // Financials
            if deal.raiseAmount != nil || deal.valuation != nil {
                HStack(spacing: 16) {
                    if let raise = deal.raiseAmount {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Raise")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .textCase(.uppercase)
                            Text(raise.formattedAsCurrency())
                                .font(.caption.bold())
                                .foregroundColor(.primary)
                        }
                    }
                    if let val = deal.valuation {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Valuation")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .textCase(.uppercase)
                            Text(val.formattedAsCurrency())
                                .font(.caption.bold())
                                .foregroundColor(.primary)
                        }
                    }
                    Spacer()
                }
            }

            // Deal owner
            if let owner = deal.dealOwner {
                HStack(spacing: 4) {
                    Image(systemName: "person.fill")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text(owner)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Stage change buttons (quick actions)
            if let onStageTap = onStageTap {
                stageMoveButtons(onStageTap: onStageTap)
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.07), radius: 6, x: 0, y: 2)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(deal.stage.color.opacity(0.3), lineWidth: 1)
        )
        .frame(width: 200)
    }

    @ViewBuilder
    private func stageMoveButtons(onStageTap: @escaping (DealStage) -> Void) -> some View {
        let stages = DealStage.allCases
        if let currentIndex = stages.firstIndex(of: deal.stage) {
            HStack(spacing: 6) {
                // Move backward
                if currentIndex > 0 {
                    Button(action: { onStageTap(stages[currentIndex - 1]) }) {
                        HStack(spacing: 2) {
                            Image(systemName: "chevron.left")
                                .font(.caption2)
                            Text(stages[currentIndex - 1].rawValue)
                                .font(.caption2)
                                .lineLimit(1)
                        }
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(.systemGray6))
                        .cornerRadius(6)
                    }
                }
                Spacer()
                // Move forward
                if currentIndex < stages.count - 1 {
                    Button(action: { onStageTap(stages[currentIndex + 1]) }) {
                        HStack(spacing: 2) {
                            Text(stages[currentIndex + 1].rawValue)
                                .font(.caption2)
                                .lineLimit(1)
                            Image(systemName: "chevron.right")
                                .font(.caption2)
                        }
                        .foregroundColor(stages[currentIndex + 1].color)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(stages[currentIndex + 1].color.opacity(0.1))
                        .cornerRadius(6)
                    }
                }
            }
        }
    }
}

#Preview {
    DealCardView(deal: Deal(
        id: "1",
        companyName: "Acme Corp",
        stage: .diligence,
        raiseAmount: 5_000_000,
        valuation: 20_000_000,
        sector: "Technology",
        dealOwner: "John Smith"
    ))
    .padding()
}
