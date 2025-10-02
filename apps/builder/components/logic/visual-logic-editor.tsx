'use client'

import { useState, useCallback } from 'react'
import { Card } from '@skemya/ui'
import { Button } from '@skemya/ui'
import { Label } from '@skemya/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@skemya/ui'
import { Input } from '@skemya/ui'
import { Badge } from '@skemya/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@skemya/ui'
import { ScrollArea } from '@skemya/ui'
import {
  Plus,
  Trash2,
  GitBranch,
  Eye,
  EyeOff,
  ArrowRight,
  SkipForward,
  Target,
  Equal,
  NotEqual,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Copy,
  Settings,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFormBuilderStore } from '../../lib/stores/form-builder-store'
import type { Block } from '@skemya/contracts'

interface LogicRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  conditions: LogicCondition[]
  actions: LogicAction[]
}

interface LogicCondition {
  id: string
  fieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value?: string | number | boolean
  combinator?: 'AND' | 'OR'
}

interface LogicAction {
  id: string
  type: 'show' | 'hide' | 'skip' | 'jump' | 'set_value' | 'calculate' | 'validate'
  targetId: string
  value?: any
  formula?: string
}

const OPERATORS = [
  { value: 'equals', label: 'Equals', icon: Equal },
  { value: 'not_equals', label: 'Does not equal', icon: NotEqual },
  { value: 'contains', label: 'Contains', icon: Search },
  { value: 'not_contains', label: 'Does not contain', icon: X },
  { value: 'greater_than', label: 'Greater than', icon: ChevronRight },
  { value: 'less_than', label: 'Less than', icon: ChevronRight },
  { value: 'is_empty', label: 'Is empty', icon: Eye },
  { value: 'is_not_empty', label: 'Is not empty', icon: Eye },
]

const ACTION_TYPES = [
  { value: 'show', label: 'Show field', icon: Eye, color: 'bg-green-500' },
  { value: 'hide', label: 'Hide field', icon: EyeOff, color: 'bg-gray-500' },
  { value: 'skip', label: 'Skip to', icon: SkipForward, color: 'bg-blue-500' },
  { value: 'jump', label: 'Jump to page', icon: ArrowRight, color: 'bg-purple-500' },
  { value: 'set_value', label: 'Set value', icon: Equal, color: 'bg-orange-500' },
  { value: 'calculate', label: 'Calculate', icon: Sparkles, color: 'bg-pink-500' },
  { value: 'validate', label: 'Validate', icon: Target, color: 'bg-red-500' },
]

export function VisualLogicEditor() {
  const { form } = useFormBuilderStore()
  const [rules, setRules] = useState<LogicRule[]>([])
  const [selectedRule, setSelectedRule] = useState<string | null>(null)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

  const allFields = form?.pages.flatMap(page => page.blocks) || []

  const createNewRule = () => {
    const newRule: LogicRule = {
      id: `rule-${Date.now()}`,
      name: `Rule ${rules.length + 1}`,
      description: '',
      enabled: true,
      conditions: [{
        id: `cond-${Date.now()}`,
        fieldId: '',
        operator: 'equals',
        value: '',
      }],
      actions: [{
        id: `action-${Date.now()}`,
        type: 'show',
        targetId: '',
      }],
    }
    setRules([...rules, newRule])
    setSelectedRule(newRule.id)
    setExpandedRules(new Set([...expandedRules, newRule.id]))
  }

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(r => r.id !== ruleId))
    if (selectedRule === ruleId) {
      setSelectedRule(null)
    }
  }

  const updateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, ...updates } : r))
  }

  const addCondition = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    const newCondition: LogicCondition = {
      id: `cond-${Date.now()}`,
      fieldId: '',
      operator: 'equals',
      value: '',
      combinator: 'AND',
    }

    updateRule(ruleId, {
      conditions: [...rule.conditions, newCondition],
    })
  }

  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<LogicCondition>) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    updateRule(ruleId, {
      conditions: rule.conditions.map(c => c.id === conditionId ? { ...c, ...updates } : c),
    })
  }

  const deleteCondition = (ruleId: string, conditionId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    updateRule(ruleId, {
      conditions: rule.conditions.filter(c => c.id !== conditionId),
    })
  }

  const addAction = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    const newAction: LogicAction = {
      id: `action-${Date.now()}`,
      type: 'show',
      targetId: '',
    }

    updateRule(ruleId, {
      actions: [...rule.actions, newAction],
    })
  }

  const updateAction = (ruleId: string, actionId: string, updates: Partial<LogicAction>) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    updateRule(ruleId, {
      actions: rule.actions.map(a => a.id === actionId ? { ...a, ...updates } : a),
    })
  }

  const deleteAction = (ruleId: string, actionId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    updateRule(ruleId, {
      actions: rule.actions.filter(a => a.id !== actionId),
    })
  }

  const duplicateRule = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    const newRule: LogicRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      conditions: rule.conditions.map(c => ({ ...c, id: `cond-${Date.now()}-${Math.random()}` })),
      actions: rule.actions.map(a => ({ ...a, id: `action-${Date.now()}-${Math.random()}` })),
    }

    setRules([...rules, newRule])
  }

  const toggleExpanded = (ruleId: string) => {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRules(newExpanded)
  }

  const renderCondition = (rule: LogicRule, condition: LogicCondition, index: number) => {
    const field = allFields.find(f => f.id === condition.fieldId)
    const operator = OPERATORS.find(o => o.value === condition.operator)

    return (
      <motion.div
        key={condition.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        {index > 0 && (
          <div className="absolute -top-8 left-12 text-sm font-medium text-gray-500">
            {condition.combinator || 'AND'}
          </div>
        )}
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 grid grid-cols-3 gap-3">
            <Select
              value={condition.fieldId}
              onValueChange={(value) => updateCondition(rule.id, condition.id, { fieldId: value })}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select field..." />
              </SelectTrigger>
              <SelectContent>
                {allFields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.question}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={condition.operator}
              onValueChange={(value) => updateCondition(rule.id, condition.id, { operator: value as any })}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    <div className="flex items-center gap-2">
                      <op.icon className="w-4 h-4" />
                      {op.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!['is_empty', 'is_not_empty'].includes(condition.operator) && (
              <Input
                value={condition.value?.toString() || ''}
                onChange={(e) => updateCondition(rule.id, condition.id, { value: e.target.value })}
                placeholder="Value..."
                className="bg-white"
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteCondition(rule.id, condition.id)}
            disabled={rule.conditions.length === 1}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  const renderAction = (rule: LogicRule, action: LogicAction) => {
    const actionType = ACTION_TYPES.find(a => a.value === action.type)
    const ActionIcon = actionType?.icon || Eye

    return (
      <motion.div
        key={action.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
      >
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', actionType?.color || 'bg-gray-500')}>
          <ActionIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <Select
            value={action.type}
            onValueChange={(value) => updateAction(rule.id, action.id, { type: value as any })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((at) => (
                <SelectItem key={at.value} value={at.value}>
                  <div className="flex items-center gap-2">
                    <at.icon className="w-4 h-4" />
                    {at.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={action.targetId}
            onValueChange={(value) => updateAction(rule.id, action.id, { targetId: value })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select target..." />
            </SelectTrigger>
            <SelectContent>
              {allFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.question}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {['set_value', 'calculate'].includes(action.type) && (
            <Input
              value={action.value?.toString() || action.formula || ''}
              onChange={(e) => updateAction(rule.id, action.id, 
                action.type === 'calculate' ? { formula: e.target.value } : { value: e.target.value }
              )}
              placeholder={action.type === 'calculate' ? 'Formula...' : 'Value...'}
              className="bg-white col-span-2"
            />
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteAction(rule.id, action.id)}
          disabled={rule.actions.length === 1}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </motion.div>
    )
  }

  const renderRule = (rule: LogicRule) => {
    const isExpanded = expandedRules.has(rule.id)
    const isSelected = selectedRule === rule.id

    return (
      <motion.div
        key={rule.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'border rounded-lg transition-all',
          isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200',
          !rule.enabled && 'opacity-60'
        )}
      >
        <div
          className="p-4 cursor-pointer"
          onClick={() => {
            setSelectedRule(rule.id)
            toggleExpanded(rule.id)
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpanded(rule.id)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <GitBranch className="w-5 h-5 text-gray-500" />

              <div>
                <div className="flex items-center gap-2">
                  <Input
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-base border-none p-0 h-auto"
                  />
                  {!rule.enabled && (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </div>
                {rule.description && (
                  <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  updateRule(rule.id, { enabled: !rule.enabled })
                }}
              >
                {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateRule(rule.id)
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteRule(rule.id)
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100"
            >
              <div className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Conditions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCondition(rule.id)}
                      className="h-8"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Condition
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {rule.conditions.map((condition, index) => renderCondition(rule, condition, index))}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-6 top-0 w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent" />
                  <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Actions</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addAction(rule.id)}
                      className="h-8"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Action
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {rule.actions.map((action) => renderAction(rule, action))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <GitBranch className="w-6 h-6 text-gray-700" />
          <h2 className="text-lg font-semibold">Logic Rules</h2>
          <Badge variant="secondary">{rules.length} rules</Badge>
        </div>
        <Button onClick={createNewRule} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      <Tabs defaultValue="visual" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Visual Editor
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="flex-1 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <AnimatePresence>
                {rules.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <GitBranch className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No logic rules yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-sm">
                      Create conditional logic to show, hide, or skip questions based on user responses
                    </p>
                    <Button onClick={createNewRule}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Rule
                    </Button>
                  </motion.div>
                ) : (
                  rules.map(renderRule)
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="advanced" className="flex-1 p-4">
          <Card className="h-full p-6">
            <h3 className="text-lg font-medium mb-4">Advanced Logic Editor</h3>
            <div className="space-y-4">
              <div>
                <Label>Expression Language</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Use JavaScript expressions for complex logic conditions
                </p>
              </div>
              <textarea
                className="w-full h-64 p-4 font-mono text-sm border rounded-lg"
                placeholder={`// Example expressions:
score > 10 && age < 30
email.includes('@company.com')
answers.q1 === 'Yes' || answers.q2 > 5`}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline">Validate</Button>
                <Button>Apply</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}