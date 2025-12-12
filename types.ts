export type Coordinate = {
  x: number;
  y: number;
};

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export interface GameState {
  snake: Coordinate[];
  food: Coordinate;
  direction: Direction;
  score: number;
  highScore: number;
  status: GameStatus;
  speed: number;
  deathReason: 'WALL' | 'SELF' | null;
}

export interface AICommentary {
  text: string;
  loading: boolean;
}