// HVSFeatures.swift
// NOIZY Empire — DSP feature extractor for HVS Live Contour
//
// Phase 1 of the v0.1 plan: extract spectral centroid + RMS envelope + zero-crossings
// from incoming PCM buffers. Pure-Swift, allocation-free in the hot path.
//
// Spec: HVS_LIVE_CONTOUR_AUv3_SPEC.md §4
// Plan: HVS_LIVE_CONTOUR_IMPLEMENTATION_PLAN_v0.1.md Phase 1

import Foundation
import Accelerate

/// Per-buffer feature vector. Plain value type — safe to ship across threads.
public struct HVSFeatures: Sendable, Equatable {
    public let timestamp: Date
    public let rms: Float                // 0...1
    public let peak: Float               // 0...1
    public let spectralCentroid: Float   // Hz, ~0...10000
    public let zeroCrossingRate: Float   // 0...1
    public let pitch: Float              // Hz, 0 = unvoiced
    public let bufferSize: Int

    public init(
        timestamp: Date = Date(),
        rms: Float,
        peak: Float,
        spectralCentroid: Float,
        zeroCrossingRate: Float,
        pitch: Float,
        bufferSize: Int
    ) {
        self.timestamp = timestamp
        self.rms = rms
        self.peak = peak
        self.spectralCentroid = spectralCentroid
        self.zeroCrossingRate = zeroCrossingRate
        self.pitch = pitch
        self.bufferSize = bufferSize
    }

    public static let silence = HVSFeatures(
        rms: 0, peak: 0, spectralCentroid: 0, zeroCrossingRate: 0, pitch: 0, bufferSize: 0
    )
}

/// Allocation-free extractor. Init once, call extract() per buffer.
public final class HVSFeatureExtractor: @unchecked Sendable {
    public let sampleRate: Float
    public let bufferSize: Int

    // Pre-allocated FFT setup
    private let fftSetup: vDSP.FFT<DSPSplitComplex>?
    private let log2N: Int
    private var realBuffer: [Float]
    private var imagBuffer: [Float]
    private var magnitudes: [Float]
    private var window: [Float]

    public init(sampleRate: Float = 48000, bufferSize: Int = 512) {
        self.sampleRate = sampleRate
        self.bufferSize = bufferSize
        // Round up to next power of two for FFT
        let log2NLocal = Int(log2(Float(bufferSize)).rounded(.up))
        self.log2N = log2NLocal
        let n = 1 << log2NLocal
        self.realBuffer = [Float](repeating: 0, count: n)
        self.imagBuffer = [Float](repeating: 0, count: n)
        self.magnitudes = [Float](repeating: 0, count: n / 2)
        // Build the Hanning window without capturing self
        let hanning = vDSP.window(ofType: Float.self, usingSequence: .hanningDenormalized,
                                  count: n, isHalfWindow: false)
        self.window = hanning
        self.fftSetup = vDSP.FFT(log2n: vDSP_Length(log2NLocal), radix: .radix2, ofType: DSPSplitComplex.self)
    }

    /// Extract features from a mono float32 PCM buffer.
    /// Safe to call on the audio thread (no allocations after init).
    public func extract(_ samples: UnsafeBufferPointer<Float>) -> HVSFeatures {
        guard !samples.isEmpty else { return .silence }

        // 1. RMS
        var rms: Float = 0
        vDSP_rmsqv(samples.baseAddress!, 1, &rms, vDSP_Length(samples.count))

        // 2. Peak
        var peak: Float = 0
        vDSP_maxmgv(samples.baseAddress!, 1, &peak, vDSP_Length(samples.count))

        // 3. Zero-crossing rate
        var crossings: vDSP_Length = 0
        var lastIdx: vDSP_Length = 0
        vDSP_nzcros(samples.baseAddress!, 1, vDSP_Length(samples.count),
                    &lastIdx, &crossings, vDSP_Length(samples.count))
        let zcr = Float(crossings) / Float(samples.count)

        // 4. Spectral centroid via FFT (skip if no FFT setup)
        var centroid: Float = 0
        if let fft = fftSetup {
            // Copy + window + zero-pad
            let n = 1 << log2N
            for i in 0..<n {
                realBuffer[i] = (i < samples.count) ? samples[i] * window[i] : 0
                imagBuffer[i] = 0
            }
            realBuffer.withUnsafeMutableBufferPointer { realPtr in
                imagBuffer.withUnsafeMutableBufferPointer { imagPtr in
                    var split = DSPSplitComplex(realp: realPtr.baseAddress!, imagp: imagPtr.baseAddress!)
                    fft.forward(input: split, output: &split)
                    let halfN = n / 2
                    vDSP_zvmags(&split, 1, &magnitudes, 1, vDSP_Length(halfN))
                    var weightedSum: Float = 0
                    var totalSum: Float = 0
                    for i in 0..<halfN {
                        let freq = Float(i) * sampleRate / Float(n)
                        weightedSum += magnitudes[i] * freq
                        totalSum += magnitudes[i]
                    }
                    centroid = totalSum > 0 ? weightedSum / totalSum : 0
                }
            }
        }

        // 5. Pitch (cheap autocorrelation YIN-lite — placeholder for v0.1, real YIN in v0.2)
        let pitch: Float = 0  // Stubbed; v0.2 implements YIN via vDSP_dotpr loop

        return HVSFeatures(
            rms: rms,
            peak: peak,
            spectralCentroid: centroid,
            zeroCrossingRate: zcr,
            pitch: pitch,
            bufferSize: samples.count
        )
    }
}
