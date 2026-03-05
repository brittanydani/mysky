import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TensionPoint = {
  x: number;
  y: number;
  type: 'tension' | 'flow' | 'vitality';
  intensity: number;
};

interface SomaticContextProps {
  tensionNodes: TensionPoint[];
  addTensionNode: (node: TensionPoint) => void;
  clearNodes: () => void;
}

const SomaticContext = createContext<SomaticContextProps | undefined>(undefined);

export const SomaticProvider = ({ children }: { children: ReactNode }) => {
  const [tensionNodes, setTensionNodes] = useState<TensionPoint[]>([]);

  const addTensionNode = (node: TensionPoint) => {
    setTensionNodes((prev) => [...prev, node]);
  };

  const clearNodes = () => {
    setTensionNodes([]);
  };

  return (
    <SomaticContext.Provider value={{ tensionNodes, addTensionNode, clearNodes }}>
      {children}
    </SomaticContext.Provider>
  );
};

export const useSomaticContext = () => {
  const context = useContext(SomaticContext);
  if (!context) {
    throw new Error('useSomaticContext must be used within a SomaticProvider');
  }
  return context;
};
