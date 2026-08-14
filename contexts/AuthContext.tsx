'use client';
import { createContext, useContext, ReactNode } from 'react';
interface LocalUser { id:string; email:string }
interface Profile { id:string; email:string; display_name:string; avatar_url:string; company:string; subscription_tier:'free'|'pro'|'team'|'enterprise'; evaluations_used:number }
interface AuthContextValue { user:LocalUser; session:null; profile:Profile; loading:boolean; signIn:(email:string,password:string)=>Promise<{error:string|null}>; signUp:(email:string,password:string,name:string)=>Promise<{error:string|null}>; signOut:()=>Promise<void>; refreshProfile:()=>Promise<void> }
const user={id:'local',email:'local@mulya-astra'};
const profile={...user,display_name:'Local Evaluator',avatar_url:'',company:'',subscription_tier:'enterprise' as const,evaluations_used:0};
const AuthContext=createContext<AuthContextValue|null>(null);
export function AuthProvider({children}:{children:ReactNode}) { const noop=async()=>{}; return <AuthContext.Provider value={{user,session:null,profile,loading:false,signIn:async()=>({error:null}),signUp:async()=>({error:null}),signOut:noop,refreshProfile:noop}}>{children}</AuthContext.Provider>; }
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used within AuthProvider');return value;}
