import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('nutrition_daily_stats')
@Index(['userId', 'date'], { unique: true })
export class NutritionDailyStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ type: 'date', nullable: false })
  date: Date;

  // Macronutrients
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  calories: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  protein: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carbohydrates: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fat: number;

  // Micronutrients
  @Column('simple-json', { nullable: true, default: {} })
  micronutrients?: Record<string, number>;

  // Meal counts
  @Column({ type: 'int', default: 0 })
  breakfastCalories: number;

  @Column({ type: 'int', default: 0 })
  lunchCalories: number;

  @Column({ type: 'int', default: 0 })
  dinnerCalories: number;

  @Column({ type: 'int', default: 0 })
  snackCalories: number;

  @Column({ type: 'int', default: 0 })
  totalMeals: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
