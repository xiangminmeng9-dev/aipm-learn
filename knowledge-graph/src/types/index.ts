export interface ModuleData {
  id: string;
  name: string;
  level: number;
  level_name: string;
  is_custom?: boolean;
  progress_percentage: number;
  prerequisites?: string[];
}

export interface LinkData {
  source: string;
  target: string;
}

export interface GraphNode {
  id: string;
  name: string;
  level: number;
  level_name: string;
  is_custom: boolean;
  progress_percentage: number;
  val: number; // node size
  color: string;
}

export interface GraphLink {
  source: string;
  target: string;
  color: string;
}

export type MessageIn = {
  type: 'init';
  modules: ModuleData[];
};

export type MessageOut = {
  type: 'navigate';
  href: string;
};
