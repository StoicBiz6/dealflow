import SwiftUI

struct TasksView: View {
    var dealId: String? = nil // If nil, show all tasks across all deals

    @StateObject private var vm = AppViewModel.shared
    @State private var tasks: [DealTask] = []
    @State private var isLoading = false
    @State private var showAddTask = false
    @State private var newTaskTitle = ""

    var body: some View {
        ZStack {
            Color.dealflowBackground.ignoresSafeArea()

            if isLoading {
                ProgressView("Loading tasks...")
            } else {
                List {
                    // Pending tasks
                    let pending = tasks.filter { !$0.completed }
                    if !pending.isEmpty {
                        Section("Pending (\(pending.count))") {
                            ForEach(pending) { task in
                                TaskRow(task: task, onToggle: { toggleTask(task) })
                                    .listRowBackground(Color(.systemBackground))
                            }
                            .onDelete { offsets in deleteTasks(from: pending, at: offsets) }
                        }
                    }

                    // Completed
                    let done = tasks.filter { $0.completed }
                    if !done.isEmpty {
                        Section("Completed (\(done.count))") {
                            ForEach(done) { task in
                                TaskRow(task: task, onToggle: { toggleTask(task) })
                                    .listRowBackground(Color(.systemBackground))
                            }
                            .onDelete { offsets in deleteTasks(from: done, at: offsets) }
                        }
                    }

                    if tasks.isEmpty {
                        Section {
                            VStack(spacing: 12) {
                                Image(systemName: "checklist")
                                    .font(.system(size: 40))
                                    .foregroundColor(.secondary.opacity(0.4))
                                Text("No tasks yet")
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .listRowBackground(Color.clear)
                        }
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
        .navigationTitle(dealId != nil ? "Tasks" : "All Tasks")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showAddTask = true }) {
                    Image(systemName: "plus")
                        .foregroundColor(.dealflowBlue)
                }
            }
        }
        .sheet(isPresented: $showAddTask) {
            addTaskSheet
        }
        .task { await loadTasks() }
        .refreshable { await loadTasks() }
    }

    // MARK: - Add Task Sheet
    private var addTaskSheet: some View {
        NavigationStack {
            Form {
                Section("New Task") {
                    TextField("Task description", text: $newTaskTitle, axis: .vertical)
                        .lineLimit(3, reservesSpace: true)
                }
            }
            .navigationTitle("Add Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { showAddTask = false }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") { addTask() }
                        .disabled(newTaskTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                        .bold()
                }
            }
        }
        .presentationDetents([.medium])
    }

    // MARK: - Load Tasks
    private func loadTasks() async {
        isLoading = true
        if let did = dealId {
            tasks = (try? await SupabaseService.shared.fetchTasks(dealId: did)) ?? []
        } else {
            // Load tasks for all deals
            var all: [DealTask] = []
            for deal in vm.deals {
                if let dealTasks = try? await SupabaseService.shared.fetchTasks(dealId: deal.id) {
                    all.append(contentsOf: dealTasks)
                }
            }
            tasks = all.sorted { ($0.dueDate ?? "") < ($1.dueDate ?? "") }
        }
        isLoading = false
    }

    private func toggleTask(_ task: DealTask) {
        guard let idx = tasks.firstIndex(where: { $0.id == task.id }) else { return }
        tasks[idx].completed.toggle()
        let updated = tasks[idx]
        Task { try? await SupabaseService.shared.updateTask(updated) }
    }

    private func addTask() {
        guard let did = dealId else { return }
        let title = newTaskTitle.trimmingCharacters(in: .whitespaces)
        guard !title.isEmpty else { return }
        newTaskTitle = ""
        showAddTask = false
        let task = DealTask(dealId: did, title: title)
        tasks.insert(task, at: 0)
        Task { _ = try? await SupabaseService.shared.createTask(task) }
    }

    private func deleteTasks(from list: [DealTask], at offsets: IndexSet) {
        let toDelete = offsets.map { list[$0] }
        tasks.removeAll { toDelete.contains($0) }
        Task {
            for task in toDelete {
                try? await SupabaseService.shared.deleteTask(id: task.id)
            }
        }
    }
}

// MARK: - Task Row
struct TaskRow: View {
    let task: DealTask
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onToggle) {
                Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundColor(task.completed ? .green : .secondary)
            }
            .buttonStyle(PlainButtonStyle())

            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.subheadline)
                    .strikethrough(task.completed)
                    .foregroundColor(task.completed ? .secondary : .primary)

                if let due = task.dueDate?.formattedDate() {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .font(.caption2)
                        Text(due)
                            .font(.caption)
                    }
                    .foregroundColor(task.isOverdue ? .red : .secondary)
                }
            }

            Spacer()

            if task.isOverdue {
                Image(systemName: "exclamationmark.circle.fill")
                    .foregroundColor(.red)
                    .font(.caption)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        TasksView()
    }
}
