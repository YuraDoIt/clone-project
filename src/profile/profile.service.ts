import { UserEntity } from '@app/user/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from './followers.entity';
import { ProfileType } from './types/profile.type';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async getProfile(
    userProfileName: string,
    currentUserId: number,
  ): Promise<ProfileType> {
    const userProfile = await this.userRepository.findOne({
      username: userProfileName,
    });
    if (!userProfile) {
      throw new HttpException(
        'This is not correct profile url',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { ...userProfile, following: false };
  }

  async followProfile(
    currentUserId: number,
    username: string,
  ): Promise<ProfileType> {
    const userProfile = await this.userRepository.findOne({
      username: username,
    });
    if (!userProfile) {
      throw new HttpException(
        'This is not correct profile url',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (currentUserId === userProfile.id) {
      throw new HttpException('Cannot follow yourself', HttpStatus.BAD_REQUEST);
    }

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: userProfile.id,
    });

    if (!follow) {
      const followToCreate = new FollowEntity();
      followToCreate.followerId = currentUserId;
      followToCreate.followingId = userProfile.id;
      await this.followRepository.save(followToCreate);
    } else {
      throw new HttpException(
        'This user is already been followed',
        HttpStatus.CONFLICT,
      );
    }

    return { ...userProfile, following: true };
  }

  async unfollowProfile(
    currentUserId: number,
    username: string,
  ): Promise<ProfileType> {
    const userProfile = await this.userRepository.findOne({
      username: username,
    });
    if (!userProfile) {
      throw new HttpException(
        'This is not correct profile url',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (currentUserId === userProfile.id) {
      throw new HttpException(
        'Cannot unfollow yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const follow = await this.followRepository.findOne({
      followerId: currentUserId,
      followingId: userProfile.id,
    });

    if (follow) {
      const followToCreate = new FollowEntity();
      followToCreate.followerId = currentUserId;
      followToCreate.followingId = userProfile.id;
      await this.followRepository.delete(followToCreate);
    } else {
      throw new HttpException(
        'This user is not followed',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { ...userProfile, following: false };
  }

  buildProfileResponse(profile) {
    delete profile.email;
    return { profile };
  }
}
