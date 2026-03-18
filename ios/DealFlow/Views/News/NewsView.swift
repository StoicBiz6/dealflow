import SwiftUI

struct NewsView: View {
    @StateObject private var vm = AppViewModel.shared
    @State private var newsItems: [NewsItem] = []
    @State private var isLoading = false
    @State private var selectedDeal: Deal? = nil

    var body: some View {
        NavigationStack {
            ZStack {
                Color.dealflowBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Deal Picker
                    if !vm.deals.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                Button("All") {
                                    selectedDeal = nil
                                    newsItems = []
                                }
                                .buttonStyle(DealChipButtonStyle(isSelected: selectedDeal == nil))

                                ForEach(vm.deals.filter { $0.stage.isActive }.prefix(10)) { deal in
                                    Button(deal.companyName) {
                                        selectedDeal = deal
                                        Task { await fetchNews(for: deal) }
                                    }
                                    .buttonStyle(DealChipButtonStyle(isSelected: selectedDeal?.id == deal.id))
                                }
                            }
                            .padding()
                        }
                        .background(Color(.systemBackground))
                    }

                    if isLoading {
                        Spacer()
                        ProgressView("Fetching market intelligence...")
                        Spacer()
                    } else if newsItems.isEmpty {
                        emptyState
                    } else {
                        List(newsItems) { item in
                            NewsItemRow(item: item)
                                .listRowBackground(Color(.systemBackground))
                                .listRowSeparator(.hidden)
                                .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                        }
                        .listStyle(.plain)
                        .scrollContentBackground(.hidden)
                    }
                }
            }
            .navigationTitle("Market Intelligence")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "newspaper")
                .font(.system(size: 52))
                .foregroundColor(.secondary.opacity(0.4))
            Text("Select a deal to see market intelligence")
                .font(.headline)
                .foregroundColor(.secondary)
            Text("AI will find comparable transactions\nand relevant market trends")
                .font(.subheadline)
                .foregroundColor(.secondary.opacity(0.7))
                .multilineTextAlignment(.center)
            Spacer()
        }
    }

    private func fetchNews(for deal: Deal) async {
        isLoading = true
        newsItems = []

        // Call the Vercel /api/deal-news endpoint
        let dealDict: [String: Any] = [
            "company_name": deal.companyName,
            "sector": deal.sector ?? "",
            "stage": deal.stage.rawValue,
            "raise_amount": deal.raiseAmount ?? 0
        ]

        guard let url = URL(string: "\(Constants.vercelBaseURL)/api/deal-news") else {
            isLoading = false
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = AuthService.shared.sessionToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = try? JSONSerialization.data(withJSONObject: ["deal": dealDict])

        if let (data, _) = try? await URLSession.shared.data(for: request) {
            // Parse various response formats
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                var items: [NewsItem] = []
                if let comps = json["comparables"] as? [[String: Any]] {
                    items += comps.compactMap { NewsItem(from: $0, type: "comparable") }
                }
                if let trends = json["trends"] as? [[String: Any]] {
                    items += trends.compactMap { NewsItem(from: $0, type: "trend") }
                }
                if let investors = json["investors"] as? [[String: Any]] {
                    items += investors.compactMap { NewsItem(from: $0, type: "investor") }
                }
                newsItems = items
            }
        }

        isLoading = false
    }
}

// MARK: - News Item Model
struct NewsItem: Identifiable {
    let id = UUID()
    let title: String
    let description: String?
    let type: String
    let amount: String?
    let date: String?

    init?(from dict: [String: Any], type: String) {
        guard let title = dict["name"] as? String ?? dict["title"] as? String ?? dict["company"] as? String else {
            return nil
        }
        self.title = title
        self.description = dict["description"] as? String ?? dict["rationale"] as? String
        self.type = type
        if let amount = dict["amount"] as? Double {
            self.amount = amount.formattedAsCurrency()
        } else {
            self.amount = dict["amount"] as? String
        }
        self.date = dict["date"] as? String
    }
}

// MARK: - News Item Row
struct NewsItemRow: View {
    let item: NewsItem

    private var typeColor: Color {
        switch item.type {
        case "comparable": return .dealflowBlue
        case "trend": return .purple
        case "investor": return .green
        default: return .secondary
        }
    }

    private var typeIcon: String {
        switch item.type {
        case "comparable": return "arrow.triangle.2.circlepath"
        case "trend": return "chart.line.uptrend.xyaxis"
        case "investor": return "person.crop.circle"
        default: return "circle"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: typeIcon)
                    .font(.caption)
                    .foregroundColor(typeColor)
                Text(item.type.capitalized)
                    .font(.caption.bold())
                    .foregroundColor(typeColor)
                    .textCase(.uppercase)
                Spacer()
                if let amount = item.amount {
                    Text(amount)
                        .font(.caption.bold())
                        .foregroundColor(.primary)
                }
            }

            Text(item.title)
                .font(.subheadline.bold())

            if let desc = item.description {
                Text(desc)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.04), radius: 4, x: 0, y: 1)
    }
}

// MARK: - Chip Button Style
struct DealChipButtonStyle: ButtonStyle {
    let isSelected: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.caption.bold())
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? Color.dealflowBlue : Color(.systemGray6))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(20)
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}

#Preview {
    NewsView()
}
