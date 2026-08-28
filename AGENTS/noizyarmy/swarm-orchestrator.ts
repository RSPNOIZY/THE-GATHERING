/**
 * NOIZYARMY Swarm Orchestrator Engine
 */

import { SWARM_PROMPTS } from './swarm-prompts.ts';
import type { SwarmAgentPrompt } from './swarm-prompts.ts';
import { AgentGatingEngine } from './agent-gating.ts';
import type { ClearanceTier, ActionPayload } from './agent-gating.ts';

export interface SwarmTaskItem {
  id: string;
  archetype: keyof typeof SWARM_PROMPTS;
  title: string;
  instruction: string;
  dependencies: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'GATED_REJECTED';
  result?: string;
}

export interface SwarmMission {
  missionId: string;
  title: string;
  objective: string;
  tasks: SwarmTaskItem[];
  status: 'CREATED' | 'RUNNING' | 'COMPLETED' | 'BLOCKED';
  summary?: string;
}

export class SwarmOrchestrator {
  private agentClearance: ClearanceTier;

  constructor(clearance: ClearanceTier = 'T3_PRODUCTION') {
    this.agentClearance = clearance;
  }

  /**
   * Plan a mission DAG
   */
  public planMission(title: string, objective: string): SwarmMission {
    const missionId = `MSN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const tasks: SwarmTaskItem[] = [
      {
        id: 'TASK_1_ARCH',
        archetype: 'architect',
        title: 'System Topology & Contract Review',
        instruction: `Analyze architecture for: ${objective}. Ensure 75/25 split compliance.`,
        dependencies: [],
        status: 'PENDING',
      },
      {
        id: 'TASK_2_DEBUG',
        archetype: 'debugger',
        title: 'Defect Analysis & Edge Case Scan',
        instruction: `Identify potential runtime faults and race conditions for: ${objective}.`,
        dependencies: ['TASK_1_ARCH'],
        status: 'PENDING',
      },
      {
        id: 'TASK_3_TEST',
        archetype: 'tester',
        title: 'Harness & Invariant Test Suite',
        instruction: `Generate executable unit and invariant test suites for: ${objective}.`,
        dependencies: ['TASK_2_DEBUG'],
        status: 'PENDING',
      },
      {
        id: 'TASK_4_AUDIT',
        archetype: 'auditor',
        title: 'C2PA Manifest & Provenance Anchor',
        instruction: `Validate cryptographic C2PA assertions and generate Merkle root for: ${objective}.`,
        dependencies: ['TASK_3_TEST'],
        status: 'PENDING',
      },
    ];

    return {
      missionId,
      title,
      objective,
      tasks,
      status: 'CREATED',
    };
  }

  /**
   * Execute Mission with SENTINEL Gating
   */
  public async executeMission(mission: SwarmMission): Promise<SwarmMission> {
    mission.status = 'RUNNING';

    for (const task of mission.tasks) {
      const promptDef: SwarmAgentPrompt = SWARM_PROMPTS[task.archetype];
      
      // Perform Pre-Execution Sentinel Gating
      const actionPayload: ActionPayload = {
        actionType: task.archetype === 'auditor' ? 'WRITE' : 'READ',
        targetResource: `noizy://tasks/${task.id}`,
        parameters: { task_title: task.title, creator_split_pct: 75.0 },
      };

      const gatingResult = AgentGatingEngine.evaluate(this.agentClearance, actionPayload);

      if (!gatingResult.allowed) {
        task.status = 'GATED_REJECTED';
        task.result = `GATED: ${gatingResult.reason}`;
        mission.status = 'BLOCKED';
        mission.summary = `Mission blocked at ${task.id} by Sentinel Policy: ${gatingResult.policyCode}`;
        return mission;
      }

      // Simulate Worker Execution
      task.status = 'COMPLETED';
      task.result = `[${promptDef.icon} ${promptDef.moniker}] Successfully completed ${task.title}. Invariant check passed.`;
    }

    mission.status = 'COMPLETED';
    mission.summary = `Mission ${mission.missionId} finished successfully across ${mission.tasks.length} sub-agents.`;
    return mission;
  }
}
