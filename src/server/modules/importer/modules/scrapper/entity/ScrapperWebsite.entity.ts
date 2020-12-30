import {Column, Entity, Index, OneToMany} from 'typeorm';

import {DatedRecordEntity} from '@server/modules/database/DatedRecord.entity';
import {ScrapperRemoteEntity} from './ScrapperRemote.entity';

@Entity(
  {
    name: 'scrapper_website',
  },
)
export class ScrapperWebsiteEntity extends DatedRecordEntity {
  @Column()
  @Index(
    {
      unique: true,
    },
  )
  url: string;

  @Column('text', {nullable: true})
  description: string;

  @Column('text', {nullable: true})
  title: string;

  @Column('text', {nullable: true})
  faviconUrl: string;

  @OneToMany(() => ScrapperRemoteEntity, (remote) => remote.website)
  remoteRecords: ScrapperRemoteEntity[];

  constructor(partial: Partial<ScrapperWebsiteEntity>) {
    super();
    Object.assign(this, partial);
  }
}
