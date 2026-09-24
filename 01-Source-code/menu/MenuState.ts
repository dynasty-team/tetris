// 01-Source-code/menu/MenuState.ts
//
// เก็บสถานะของหน้า Main Menu (ตัวเลือกอะไรบ้าง, ตอนนี้เลือกอันไหนอยู่)
// ไม่ยุ่งกับ core-engine หรือ GameStateLoop เลย — เป็นคนละชั้นกัน

export type MenuOptionId = 'start' | 'highscore' | 'exit';

export interface MenuOption {
  id: MenuOptionId;
  label: string;
}

const MENU_OPTIONS: MenuOption[] = [
  { id: 'start', label: 'Start' },
  { id: 'highscore', label: 'High Score' },
  { id: 'exit', label: 'Exit' },
];

export class MenuState {
  public readonly options: MenuOption[] = MENU_OPTIONS;
  private selectedIndex = 0;

  public moveUp(): void {
    this.selectedIndex =
      (this.selectedIndex - 1 + this.options.length) % this.options.length;
  }

  public moveDown(): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public getSelectedOption(): MenuOption {
    const option = this.options[this.selectedIndex];
    if (!option) throw new Error('Menu option out of range');
    return option;
  }
}