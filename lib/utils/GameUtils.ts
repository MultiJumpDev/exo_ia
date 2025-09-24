export class GameUtils {
  static calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  static isCircleClicked(circle: { x: number; y: number; radius: number }, pointer: { x: number; y: number }): boolean {
    const distance = this.calculateDistance(circle.x, circle.y, pointer.x, pointer.y)
    return distance <= circle.radius
  }

  static calculateScore(combo: number, baseScore = 100): number {
    const multiplier = Math.min(1 + combo * 0.1, 4) // Max 4x multiplier
    return Math.floor(baseScore * multiplier)
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }
}
