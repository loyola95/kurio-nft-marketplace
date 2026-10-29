import { describe, expect, it } from 'vitest'
import { ChangePasswordInput, UpdateProfileInput } from './profile'
import { WalletInput } from './wallet'

const wallet = {
  displayName: 'Ana Souza',
  nickname: 'Principal',
  network: 'ethereum' as const,
  profileName: 'ana.souza',
  address: '0xA91F3c5B7d2e4F6a8B0c1D2e3F4a5B6c7D8eE82C',
  ensOrSecondary: '',
  walletType: 'metamask' as const,
  referralCode: 'KURIO-ANA',
  email: 'ana@kurio.dev',
  ensName: 'nova.eth',
}

const issues = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : [...new Set(result.error!.issues.map((i) => i.path.join('.')))]

describe('carteira', () => {
  it('aceita endereço EVM de 40 hexadecimais', () => {
    expect(WalletInput.safeParse(wallet).success).toBe(true)
  })

  it('recusa endereço EVM curto ou sem 0x', () => {
    expect(issues(WalletInput.safeParse({ ...wallet, address: '0x123' }))).toEqual(['address'])
    expect(
      issues(
        WalletInput.safeParse({ ...wallet, address: 'A91F3c5B7d2e4F6a8B0c1D2e3F4a5B6c7D8eE82C' }),
      ),
    ).toEqual(['address'])
  })

  it('Solana usa base58 de 32 a 44 caracteres', () => {
    const solana = { ...wallet, network: 'solana' as const, walletType: 'walletconnect' as const }
    expect(
      WalletInput.safeParse({ ...solana, address: '7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2' })
        .success,
    ).toBe(true)
    expect(issues(WalletInput.safeParse({ ...solana, address: wallet.address }))).toEqual([
      'address',
    ])
  })

  it('MetaMask não aceita Solana', () => {
    const r = WalletInput.safeParse({
      ...wallet,
      network: 'solana',
      address: '7Np41oeYqPefeNQEHSv1UDhYrehxin3NStELsSKCT4K2',
    })
    expect(issues(r)).toEqual(['walletType'])
  })

  it('campos com asterisco no Figma são obrigatórios', () => {
    const r = WalletInput.safeParse({
      ...wallet,
      nickname: '',
      profileName: '',
      referralCode: '',
      email: '',
      ensName: '',
    })
    expect(issues(r).sort()).toEqual([
      'email',
      'ensName',
      'nickname',
      'profileName',
      'referralCode',
    ])
  })

  it('ENS aceita subnome (nova.kurio.eth) e exige .eth', () => {
    expect(WalletInput.safeParse({ ...wallet, ensName: 'nova.kurio.eth' }).success).toBe(true)
    expect(issues(WalletInput.safeParse({ ...wallet, ensName: 'nova.com' }))).toEqual(['ensName'])
  })
})

describe('perfil', () => {
  const profile = {
    displayName: 'Ana Souza',
    username: 'ana.souza',
    email: 'ana@kurio.dev',
    ensName: 'nova.eth',
    walletNickname: 'Nova',
  }

  it('aceita o perfil completo', () => {
    expect(UpdateProfileInput.safeParse(profile).success).toBe(true)
  })

  it('exige nome ENS e apelido da carteira (asteriscos do Figma)', () => {
    expect(
      issues(UpdateProfileInput.safeParse({ ...profile, ensName: '', walletNickname: ' ' })).sort(),
    ).toEqual(['ensName', 'walletNickname'])
  })

  it('nova senha precisa de 8 caracteres com letras e números', () => {
    expect(
      ChangePasswordInput.safeParse({ currentPassword: 'x', newPassword: 'curta1' }).success,
    ).toBe(false)
    expect(
      ChangePasswordInput.safeParse({ currentPassword: 'x', newPassword: 'somenteletras' }).success,
    ).toBe(false)
    expect(
      ChangePasswordInput.safeParse({ currentPassword: 'x', newPassword: 'Senha1234' }).success,
    ).toBe(true)
  })
})
