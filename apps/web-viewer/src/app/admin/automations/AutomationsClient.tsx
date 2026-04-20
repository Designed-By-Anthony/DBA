"use client";

import { useState } from "react";
import type { AutomationRule, AutomationTrigger, AutomationAction } from "@/lib/types";
import { toggleAutomation, deleteAutomation, createAutomation } from "./actions";
import { Activity, ArrowRight, Plus, Trash2, Zap, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  prospect_status_changed: "Prospect changes status",
  ticket_created: "New support ticket is opened",
  activity_added: "Activity is logged on timeline",
  form_submission: "Public webhook form submitted"
};

const ACTION_LABELS: Record<AutomationAction["type"], string> = {
  send_email: "Send generic email sequence",
  add_tag: "Append a background tag",
  change_status: "Move to a new pipeline stage",
  create_activity: "Log an automated system note"
};

export default function AutomationsClient({ initialRules }: { initialRules: AutomationRule[] }) {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftTrigger, setDraftTrigger] = useState<AutomationTrigger>("prospect_status_changed");
  const [draftAction, setDraftAction] = useState<AutomationAction["type"]>("add_tag");
  const [loading, setLoading] = useState(false);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !current } : r));
      await toggleAutomation(id, !current);
      toast.success(current ? "Automation paused" : "Automation active");
    } catch {
      toast.error("Failed to toggle rule");
    }
  };

  const handleDelete = async (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    await deleteAutomation(id);
    toast.success("Rule permanently deleted");
  };

  const handleSaveDraft = async () => {
    if (!draftName.trim()) {
      toast.error("Please name this automation.");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = draftAction === 'add_tag' ? { tag: 'System_Automated' } : {};
      const newId = await createAutomation(draftName, draftTrigger, { type: draftAction, payload });
      
      const newRule: AutomationRule = {
        id: newId,
        agencyId: "temp",
        name: draftName,
        isActive: true,
        trigger: draftTrigger,
        action: { type: draftAction, payload },
        createdAt: new Date().toISOString()
      };
      
      setRules([newRule, ...rules]);
      setIsDrafting(false);
      setDraftName("");
      toast.success("Automation live");
    } catch {
      toast.error("Engine failed to create automation.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-2 animate-fade-in">
        <div className="p-2 bg-brand-subtle rounded-lg">
          <Zap size={20} className="text-(--color-brand)" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Workflow Hub</h1>
      </div>
      <p className="text-text-muted text-sm mb-10 animate-fade-in">Zero-friction automation constraints. Build custom rules to let the CRM orchestrate itself.</p>

      {/* Editor / List Area */}
      <div className="space-y-4">
        
        <AnimatePresence>
          {isDrafting && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              className="glass-card p-5 border border-(--color-brand) bg-[color-mix(in_srgb,var(--color-brand)_5%,transparent)] overflow-hidden"
            >
              <div className="flex flex-col gap-5">
                <div>
                  <input 
                    type="text" 
                    value={draftName} 
                    onChange={e => setDraftName(e.target.value)} 
                    placeholder="E.g., Flag Unhappy Clients" 
                    className="w-full bg-transparent text-xl font-semibold text-white placeholder-white/20 outline-none border-b border-transparent focus:border-glass-border pb-2 transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="font-mono bg-surface-2 px-2 py-1 rounded text-xs">IF</span>
                    <select 
                      value={draftTrigger} 
                      onChange={e => setDraftTrigger(e.target.value as AutomationTrigger)}
                      className="bg-transparent text-white font-medium outline-none cursor-pointer border-b border-dashed border-text-muted hover:border-white transition-colors"
                    >
                      {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-(--color-surface-0)">{v}</option>
                      ))}
                    </select>
                  </div>
                  
                  <ArrowRight size={14} className="text-(--color-brand)" />
                  
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span className="font-mono bg-surface-2 px-2 py-1 rounded text-xs">THEN</span>
                    <select 
                      value={draftAction} 
                      onChange={e => setDraftAction(e.target.value as AutomationAction["type"])}
                      className="bg-transparent text-white font-medium outline-none cursor-pointer border-b border-dashed border-text-muted hover:border-white transition-colors"
                    >
                      {Object.entries(ACTION_LABELS).map(([k, v]) => (
                        <option key={k} value={k} className="bg-(--color-surface-0)">{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4 border-t border-glass-border pt-4">
                  <button onClick={() => setIsDrafting(false)} className="text-xs text-text-muted hover:text-white px-3 py-1.5 transition-colors">Cancel</button>
                  <button 
                    onClick={handleSaveDraft} 
                    disabled={loading}
                    className="bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded text-xs font-semibold shadow-lg shadow-white/10 transition-all disabled:opacity-50"
                  >
                    {loading ? "Deploying..." : "Deploy Rule"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {rules.map((rule, idx) => (
          <motion.div 
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
              rule.isActive ? 'bg-surface-1 border-glass-border hover:border-glass-border-hover' : 'bg-(--color-surface-0) border-dashed border-glass-border opacity-60'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
               <button 
                onClick={() => handleToggle(rule.id, rule.isActive)}
                className={`w-10 h-6 shrink-0 rounded-full transition-colors relative flex items-center px-1 ${rule.isActive ? 'bg-(--color-brand)' : 'bg-surface-3'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${rule.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                  {rule.name}
                  {!rule.isActive && <span className="text-[10px] font-mono bg-surface-3 text-text-muted px-1.5 rounded uppercase">Paused</span>}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-1 truncate">
                  <Activity size={12} className="shrink-0" />
                  <span className="font-mono text-white/50">IF</span> {TRIGGER_LABELS[rule.trigger]} 
                  <ArrowRight size={10} className="shrink-0 text-white/30" /> 
                  <span className="font-mono text-white/50">THEN</span> {ACTION_LABELS[rule.action.type]}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button className="p-2 text-text-muted hover:text-white rounded hover:bg-surface-2 transition-colors"><Settings2 size={16} /></button>
               <button onClick={() => handleDelete(rule.id)} className="p-2 text-text-muted hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
            </div>
          </motion.div>
        ))}

        {!isDrafting && (
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setIsDrafting(true)}
            className="w-full py-4 border border-dashed border-glass-border rounded-xl flex items-center justify-center gap-2 text-sm text-text-muted hover:text-white hover:bg-surface-1 transition-all mt-6"
          >
            <Plus size={16} /> Combine Triggers & Actions
          </motion.button>
        )}
        
      </div>
    </div>
  );
}
