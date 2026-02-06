import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('nutrition_weekly_stats')
@Index(['userId', 'weekStart', 'weekEnd'], { unique: true })
export class NutritionWeeklyStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ type: 'date', nullable: false })
  weekStart: Date;

  @Column({ type: 'date', nullable: false })
  weekEnd: Date;

  @Column({ type: 'int', nullable: false })
  weekNumber: number;

  @Column({ type: 'int', nullable: false })
  year: number;

  // Average daily values
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgCalories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgProtein: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgCarbohydrates: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  avgFat: number;

  // Total weekly values
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCalories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProtein: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCarbohydrates: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalFat: number;

  // Micronutrients totals
  @Column('simple-json', { nullable: true, default: {} })
  totalMicronutrients?: Record<string, number>;

  // Daily breakdown
  @Column({ type: 'int', default: 0 })
  daysTracked: number;

  @Column({ type: 'int', default: 0 })
  goalStreakDays: number; // Days within calorie goal

  // Meal distribution totals
  @Column({ type: 'int', default: 0 })
  totalBreakfastCalories: number;

  @Column({ type: 'int', default: 0 })
  totalLunchCalories: number;

  @Column({ type: 'int', default: 0 })
  totalDinnerCalories: number;

  @Column({ type: 'int', default: 0 })
  totalSnackCalories: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
