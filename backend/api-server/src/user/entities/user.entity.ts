import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../user.types';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  username: string;

  @Column({ nullable: true, unique: true })
  email?: string;

  @Column({ nullable: true, unique: true })
  phone?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: Role.User })
  role: string;

  @Column({ nullable: true })
  age?: number;

  @Column({ nullable: true })
  sex?: string;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  height?: number;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2 })
  weight?: number;

  @Column({ nullable: true })
  activityLevel?: string;

  @Column({ nullable: true })
  dietType?: string;

  @Column({ nullable: true })
  primaryGoal?: string;

  @Column({ default: false })
  profileCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
