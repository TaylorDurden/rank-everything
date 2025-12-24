'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Settings2, 
  Target, 
  FileCheck,
  ClipboardList
} from 'lucide-react';

const steps = [
  { id: 'template', name: 'Select Template', icon: Settings2 },
  { id: 'asset', name: 'Select Asset', icon: Target },
  { id: 'scoring', name: 'Core Scoring', icon: ClipboardList },
  { id: 'review', name: 'Final Review', icon: FileCheck },
];

export default function NewEvaluationWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Evaluation</h2>
        <p className="text-muted-foreground">
          Follow the steps to conduct a thorough asset evaluation.
        </p>
      </div>

      {/* Stepper */}
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, index) => (
            <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} flex-1`}>
              {index < currentStep ? (
                <div className="flex items-center" aria-current="step">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                  <span className="ml-4 text-sm font-medium text-primary hidden md:block">{step.name}</span>
                </div>
              ) : index === currentStep ? (
                <div className="flex items-center" aria-current="step">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <step.icon className="h-5 w-5 text-primary" />
                  </span>
                  <span className="ml-4 text-sm font-medium text-primary hidden md:block">{step.name}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted bg-background">
                    <step.icon className="h-5 w-5 text-muted-foreground" />
                  </span>
                  <span className="ml-4 text-sm font-medium text-muted-foreground hidden md:block">{step.name}</span>
                </div>
              )}
              {index !== steps.length - 1 && (
                <div className="absolute top-5 left-10 w-full pr-8 sm:pr-20" aria-hidden="true">
                  <div className={`h-0.5 w-full ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Content Area */}
      <div className="min-h-[400px] p-8 bg-card border rounded-2xl shadow-sm">
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold">Which template would you like to use?</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Security & Compliance', 'Operational Efficiency', 'Market Competitiveness'].map((t) => (
                <div key={t} className="p-4 border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium group-hover:text-primary transition-colors">{t}</p>
                    <div className="h-6 w-6 rounded-full border flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary opacity-0 group-hover:opacity-100" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">12 scoring dimensions • Standard industrial benchmark</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep > 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Step {currentStep + 1} content will be implemented next.
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between pt-4">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-6 py-2 rounded-md border font-medium text-sm hover:bg-accent disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          {currentStep === steps.length - 1 ? 'Finish' : 'Next Step'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
