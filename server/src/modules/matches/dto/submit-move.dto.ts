
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class SubmitMoveDto {
    @IsString()
    @Matches(/^[a-h][1-8]$/, {
        message: 'from must be a valid chess square',
    })
    from!: string;

    @IsString()
    @Matches(/^[a-h][1-8]$/, {
        message: 'to must be a valid chess square',
    })
    to!: string;

    @IsOptional()
    @IsString()
    @IsIn(['q', 'r', 'b', 'n'])
    promotion?: 'q' | 'r' | 'b' | 'n';
}
