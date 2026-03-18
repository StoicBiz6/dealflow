import SwiftUI

struct DealDetailView: View {
    @State private var deal: Deal
    @StateObject private var vm = AppViewModel.shared
    @State private var isEditing = false
    @State private var showStagePicker = false
    @State private var tasks: [DealTask] = []
    @State private var isSaving = false
    @State private var error: String? = nil
    @State private var showEmailGenerator = false
    @State private var generatedEmail: (subject: String, body: String)? = nil

    init(deal: Deal) {
        _deal = State(initialValue: deal)
    }

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                // Header
                headerCard

                // Metrics
                if let metrics = deal.metrics {
                    metricsCard(metrics: metrics)
                }

                // Score
                if let score = deal.score {
                    scoreCard(score: score)
                }

                // Contacts
                if let contacts = deal.contacts, !contacts.isEmpty {
                    contactsCard(contacts: contacts)
                }

                // Notes / Memo
                if let notes = deal.notes, !notes.isEmpty {
                    notesCard(title: "Notes", content: notes, icon: "note.text")
                }
                if let memo = deal.memo, !memo.isEmpty {
                    notesCard(title: "Investment Thesis", content: memo, icon: "doc.text")
                }

                // Tasks
                tasksCard

                // Buyers
                if let buyers = deal.buyers, !buyers.isEmpty {
                    buyersCard(buyers: buyers)
                }
            }
            .padding()
        }
        .background(Color.dealflowBackground.ignoresSafeArea())
        .navigationTitle(deal.companyName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(isEditing ? "Done" : "Edit") {
                    if isEditing { saveChanges() }
                    else { isEditing.toggle() }
                }
                .foregroundColor(.dealflowBlue)
            }
        }
        .task { await loadTasks() }
        .sheet(isPresented: $showEmailGenerator) {
            EmailGeneratorView(deal: deal)
        }
    }

    // MARK: - Header Card
    private var headerCard: some View {
        VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    if isEditing {
                        TextField("Company Name", text: $deal.companyName)
                            .font(.title2.bold())
                            .textFieldStyle(.roundedBorder)
                    } else {
                        Text(deal.companyName)
                            .font(.title2.bold())
                    }

                    if let sector = deal.sector {
                        Text(sector)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()

                // Stage Badge
                Button(action: { showStagePicker = true }) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(deal.stage.color)
                            .frame(width: 8, height: 8)
                        Text(deal.stage.rawValue)
                            .font(.caption.bold())
                            .foregroundColor(deal.stage.color)
                        if !isEditing {
                            Image(systemName: "chevron.down")
                                .font(.caption2)
                                .foregroundColor(deal.stage.color)
                        }
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(deal.stage.color.opacity(0.12))
                    .cornerRadius(20)
                }
                .confirmationDialog("Move Stage", isPresented: $showStagePicker) {
                    ForEach(DealStage.allCases) { stage in
                        Button(stage.rawValue) {
                            deal.stage = stage
                            Task { try? await vm.updateStage(dealId: deal.id, stage: stage) }
                        }
                    }
                }
            }

            Divider()

            // Key Metrics Row
            HStack(spacing: 20) {
                if let raise = deal.raiseAmount {
                    metricPill(label: "Raise", value: raise.formattedAsCurrency(), color: .dealflowBlue)
                }
                if let val = deal.valuation {
                    metricPill(label: "Valuation", value: val.formattedAsCurrency(), color: .purple)
                }
                if let fee = deal.estimatedFee {
                    metricPill(label: "Est. Fee", value: fee.formattedAsCurrency(), color: .green)
                }
            }

            // Action Buttons
            HStack(spacing: 10) {
                if let website = deal.website, let url = URL(string: website) {
                    Link(destination: url) {
                        Label("Website", systemImage: "safari")
                            .font(.caption.bold())
                            .padding(.horizontal, 12)
                            .padding(.vertical, 7)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                            .foregroundColor(.primary)
                    }
                }
                Button(action: { showEmailGenerator = true }) {
                    Label("Email", systemImage: "envelope")
                        .font(.caption.bold())
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                        .foregroundColor(.primary)
                }
                Spacer()
                if let owner = deal.dealOwner {
                    HStack(spacing: 4) {
                        Image(systemName: "person.circle")
                            .font(.caption)
                        Text(owner)
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
            }
        }
        .cardStyle()
    }

    private func metricPill(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.subheadline.bold())
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Metrics Card
    private func metricsCard(metrics: DealMetrics) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Financials", systemImage: "chart.bar")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                if let rev = metrics.revenue {
                    metricRow("Revenue", value: rev.formattedAsCurrency())
                }
                if let ebitda = metrics.ebitda {
                    metricRow("EBITDA", value: ebitda.formattedAsCurrency())
                }
                if let arr = metrics.arr {
                    metricRow("ARR", value: arr.formattedAsCurrency())
                }
                if let growth = metrics.growthRate {
                    metricRow("Growth", value: growth.formattedAsPercent())
                }
                if let margin = metrics.grossMargin {
                    metricRow("Gross Margin", value: margin.formattedAsPercent())
                }
                if let emp = metrics.employees {
                    metricRow("Employees", value: "\(emp)")
                }
            }
        }
        .cardStyle()
    }

    private func metricRow(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.subheadline.bold())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Score Card
    private func scoreCard(score: DealScore) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Deal Score", systemImage: "star.fill")
                .font(.headline)

            HStack(spacing: 16) {
                ForEach([
                    ("Team", score.team),
                    ("Market", score.market),
                    ("Traction", score.traction),
                    ("Terms", score.terms),
                    ("Overall", score.overall)
                ], id: \.0) { name, rating in
                    if let r = rating {
                        scoreItem(name: name, rating: r)
                    }
                }
            }

            if let rationale = score.rationale, !rationale.isEmpty {
                Text(rationale)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .cardStyle()
    }

    private func scoreItem(_ name: String, rating: Int) -> some View {
        VStack(spacing: 4) {
            Text("\(rating)")
                .font(.title3.bold())
                .foregroundColor(rating >= 4 ? .green : rating >= 3 ? .orange : .red)
            Text(name)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Contacts Card
    private func contactsCard(contacts: [DealContact]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Contacts (\(contacts.count))", systemImage: "person.2")
                .font(.headline)

            ForEach(contacts) { contact in
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.dealflowBlue.opacity(0.15))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Text(String(contact.name.prefix(1)))
                                .font(.subheadline.bold())
                                .foregroundColor(.dealflowBlue)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(contact.name)
                            .font(.subheadline.bold())
                        if let title = contact.title {
                            Text(title)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Spacer()

                    if let email = contact.email {
                        Link(destination: URL(string: "mailto:\(email)")!) {
                            Image(systemName: "envelope.circle.fill")
                                .font(.title3)
                                .foregroundColor(.dealflowBlue)
                        }
                    }
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Notes Card
    private func notesCard(title: String, content: String, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(title, systemImage: icon)
                .font(.headline)
            Text(content)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .cardStyle()
    }

    // MARK: - Tasks Card
    private var tasksCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Tasks", systemImage: "checklist")
                    .font(.headline)
                Spacer()
                Text("\(tasks.filter { $0.completed }.count)/\(tasks.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if tasks.isEmpty {
                Text("No tasks yet")
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                ForEach($tasks) { $task in
                    HStack(spacing: 10) {
                        Button(action: { toggleTask(&task) }) {
                            Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(task.completed ? .green : .secondary)
                        }
                        Text(task.title)
                            .font(.subheadline)
                            .strikethrough(task.completed)
                            .foregroundColor(task.completed ? .secondary : .primary)
                        Spacer()
                        if task.isOverdue {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundColor(.red)
                                .font(.caption)
                        }
                    }
                }
            }

            NavigationLink(destination: TasksView(dealId: deal.id)) {
                Label("Manage Tasks", systemImage: "arrow.right")
                    .font(.caption.bold())
                    .foregroundColor(.dealflowBlue)
            }
        }
        .cardStyle()
    }

    // MARK: - Buyers Card
    private func buyersCard(buyers: [Buyer]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Buyer Universe (\(buyers.count))", systemImage: "person.3")
                .font(.headline)

            ForEach(buyers) { buyer in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(buyer.name)
                            .font(.subheadline.bold())
                        if let type = buyer.type {
                            Text(type)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    Spacer()
                }
            }
        }
        .cardStyle()
    }

    // MARK: - Actions
    private func loadTasks() async {
        tasks = (try? await SupabaseService.shared.fetchTasks(dealId: deal.id)) ?? []
    }

    private func toggleTask(_ task: inout DealTask) {
        task.completed.toggle()
        let taskCopy = task
        Task { try? await SupabaseService.shared.updateTask(taskCopy) }
    }

    private func saveChanges() {
        isEditing = false
        Task { try? await vm.updateDeal(deal) }
    }
}

// MARK: - Email Generator View
struct EmailGeneratorView: View {
    let deal: Deal
    @State private var contactName = ""
    @State private var purpose = "introduction"
    @State private var generatedSubject = ""
    @State private var generatedBody = ""
    @State private var isLoading = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Recipient") {
                    TextField("Contact Name", text: $contactName)
                    Picker("Purpose", selection: $purpose) {
                        Text("Introduction").tag("introduction")
                        Text("Follow Up").tag("follow-up")
                        Text("Term Sheet").tag("term-sheet")
                        Text("Closing").tag("closing")
                    }
                }

                Section {
                    Button(action: generate) {
                        HStack {
                            if isLoading { ProgressView().scaleEffect(0.8) }
                            Label(isLoading ? "Generating..." : "Generate Email",
                                  systemImage: "sparkles")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .disabled(isLoading)
                }

                if !generatedSubject.isEmpty {
                    Section("Subject") {
                        Text(generatedSubject)
                            .textSelection(.enabled)
                    }
                    Section("Body") {
                        Text(generatedBody)
                            .font(.subheadline)
                            .textSelection(.enabled)
                    }
                }
            }
            .navigationTitle("Generate Email")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func generate() {
        isLoading = true
        Task {
            if let result = try? await AIService.shared.generateEmail(
                deal: deal, contactName: contactName, purpose: purpose) {
                generatedSubject = result.subject ?? result.email?.components(separatedBy: "\n").first ?? ""
                generatedBody = result.body ?? result.email ?? ""
            }
            isLoading = false
        }
    }
}

#Preview {
    NavigationStack {
        DealDetailView(deal: Deal(
            id: "1",
            companyName: "Acme Corp",
            stage: .diligence,
            raiseAmount: 5_000_000,
            valuation: 20_000_000,
            sector: "Technology",
            dealOwner: "John Smith",
            notes: "Strong growth metrics, experienced team."
        ))
    }
}
