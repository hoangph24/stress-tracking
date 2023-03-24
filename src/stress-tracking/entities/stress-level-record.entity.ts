import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StressLevelRecord {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  userId: string;

  @Column()
  stressLevel: number;

  @Column()
  image: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
