import SwiftUI
import Speech

struct AddDealView: View {
    @StateObject private var vm = AppViewModel.shared
    @Environment(\.dismiss) private var dismiss

    @State private var companyName = ""
    @State private var stage: DealStage = .sourced
    @State private var sector: String = ""
    @State private var raiseAmountText = ""
    @State private var valuationText = ""
    @State private var notes = ""
    @State private var dealOwner = ""
    @State private var isLoading = false
    @State private var error: String? = nil

    // AI / Voice
    @State private var showAIChat = false
    @State private var aiMessage = ""
    @State private var isRecording = false
    @State private var isParsingAI = false
    @State private var speechRecognizer = SFSpeechRecognizer()
    @State private var recognitionTask: SFSpeechRecognitionTask?
    @State private var audioEngine = AVAudioEngine()

    var body: some View {
        NavigationStack {
            Form {
                // AI Quick Add
                Section {
                    Button(action: { showAIChat.toggle() }) {
                        HStack {
                            Image(systemName: "sparkles")
                                .foregroundColor(.purple)
                            Text("AI Quick Add")
                                .foregroundColor(.primary)
                            Spacer()
                            Image(systemName: showAIChat ? "chevron.up" : "chevron.down")
                                .foregroundColor(.secondary)
                                .font(.caption)
                        }
                    }

                    if showAIChat {
                        aiChatSection
                    }
                } header: {
                    Text("Quick Add")
                }

                // Basic Info
                Section("Deal Info") {
                    HStack {
                        Image(systemName: "building.2")
                            .foregroundColor(.dealflowBlue)
                            .frame(width: 20)
                        TextField("Company Name *", text: $companyName)
                    }

                    HStack {
                        Image(systemName: "person")
                            .foregroundColor(.dealflowBlue)
                            .frame(width: 20)
                        TextField("Deal Owner", text: $dealOwner)
                    }

                    // Stage Picker
                    Picker("Stage", selection: $stage) {
                        ForEach(DealStage.allCases) { s in
                            HStack {
                                Circle().fill(s.color).frame(width: 8, height: 8)
                                Text(s.rawValue)
                            }.tag(s)
                        }
                    }

                    // Sector Picker
                    Picker("Sector", selection: $sector) {
                        Text("Select sector").tag("")
                        ForEach(DealSector.allCases, id: \.rawValue) { s in
                            Text(s.rawValue).tag(s.rawValue)
                        }
                    }
                }

                // Financials
                Section("Financials") {
                    HStack {
                        Image(systemName: "dollarsign.circle")
                            .foregroundColor(.green)
                            .frame(width: 20)
                        TextField("Raise Amount (e.g. 5000000)", text: $raiseAmountText)
                            .keyboardType(.decimalPad)
                    }

                    HStack {
                        Image(systemName: "chart.bar.xaxis")
                            .foregroundColor(.green)
                            .frame(width: 20)
                        TextField("Valuation (e.g. 20000000)", text: $valuationText)
                            .keyboardType(.decimalPad)
                    }
                }

                // Notes
                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 80)
                }

                // Error
                if let err = error {
                    Section {
                        Text(err)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Add Deal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: saveDeal) {
                        if isLoading {
                            ProgressView().scaleEffect(0.8)
                        } else {
                            Text("Save").bold()
                        }
                    }
                    .disabled(companyName.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
                }
            }
        }
    }

    // MARK: - AI Chat Section
    private var aiChatSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Describe the deal and AI will fill in the details")
                .font(.caption)
                .foregroundColor(.secondary)

            HStack(spacing: 8) {
                TextField("e.g. 'Acme Corp, SaaS, raising $5M Series A'",
                          text: $aiMessage, axis: .vertical)
                    .lineLimit(3, reservesSpace: true)
                    .font(.subheadline)

                // Voice button
                Button(action: toggleVoice) {
                    Image(systemName: isRecording ? "waveform.circle.fill" : "mic.circle")
                        .font(.title2)
                        .foregroundColor(isRecording ? .red : .dealflowBlue)
                }
            }

            Button(action: parseWithAI) {
                HStack {
                    if isParsingAI {
                        ProgressView().scaleEffect(0.8)
                        Text("Parsing...")
                    } else {
                        Image(systemName: "sparkles")
                        Text("Parse with AI")
                    }
                }
                .font(.subheadline.bold())
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.purple)
                .cornerRadius(8)
            }
            .disabled(aiMessage.trimmingCharacters(in: .whitespaces).isEmpty || isParsingAI)
        }
    }

    // MARK: - Voice
    private func toggleVoice() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }

    private func startRecording() {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else { return }
            DispatchQueue.main.async {
                do {
                    let session = AVAudioSession.sharedInstance()
                    try session.setCategory(.record, mode: .measurement, options: .duckOthers)
                    try session.setActive(true, options: .notifyOthersOnDeactivation)

                    let inputNode = audioEngine.inputNode
                    let request = SFSpeechAudioBufferRecognitionRequest()
                    request.shouldReportPartialResults = true

                    recognitionTask = speechRecognizer?.recognitionTask(with: request) { result, err in
                        if let result = result {
                            aiMessage = result.bestTranscription.formattedString
                        }
                        if err != nil || (result?.isFinal ?? false) {
                            audioEngine.stop()
                            inputNode.removeTap(onBus: 0)
                            isRecording = false
                        }
                    }

                    let recordingFormat = inputNode.outputFormat(forBus: 0)
                    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buf, _ in
                        request.append(buf)
                    }

                    audioEngine.prepare()
                    try audioEngine.start()
                    isRecording = true
                } catch {
                    isRecording = false
                }
            }
        }
    }

    private func stopRecording() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionTask?.cancel()
        isRecording = false
    }

    // MARK: - AI Parse
    private func parseWithAI() {
        let text = aiMessage.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        isParsingAI = true
        Task {
            do {
                var response = try await AIService.shared.parseDealFromText(text)
                var tempDeal = Deal(id: "", companyName: companyName, stage: stage)
                response.applyTo(deal: &tempDeal)

                companyName = tempDeal.companyName.isEmpty ? companyName : tempDeal.companyName
                stage = tempDeal.stage
                if let s = tempDeal.sector { sector = s }
                if let r = tempDeal.raiseAmount { raiseAmountText = "\(Int(r))" }
                if let v = tempDeal.valuation { valuationText = "\(Int(v))" }
                if let n = tempDeal.notes, !n.isEmpty { notes = n }
                if let o = tempDeal.dealOwner, !o.isEmpty { dealOwner = o }

                aiMessage = ""
                showAIChat = false
            } catch {
                self.error = "AI parsing failed: \(error.localizedDescription)"
            }
            isParsingAI = false
        }
    }

    // MARK: - Save
    private func saveDeal() {
        let name = companyName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        isLoading = true
        error = nil

        Task {
            do {
                _ = try await vm.createDeal(
                    companyName: name,
                    stage: stage,
                    sector: sector.isEmpty ? nil : sector,
                    raiseAmount: Double(raiseAmountText.replacingOccurrences(of: ",", with: "")),
                    notes: notes.isEmpty ? nil : notes
                )
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    AddDealView()
}
