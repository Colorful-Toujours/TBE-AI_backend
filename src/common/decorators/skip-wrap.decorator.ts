import { SetMetadata } from '@nestjs/common';

export const SKIP_WRAP_KEY = 'skipWrap';
/** 认证登录/注册等接口返回扁平结构，不走 { success, data } 包裹 */
export const SkipWrap = () => SetMetadata(SKIP_WRAP_KEY, true);
