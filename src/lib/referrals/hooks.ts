'use client'
import { useEffect, useState } from 'react'
import useSWR from "swr"
import { useAuthenticator, useW3 } from "@w3ui/react"
import { createRefcode, createReferral } from '../referrals'
import { useSearchParams } from 'next/navigation'

interface RefcodeResult {
  refcode: string
}

interface Referral {
  referredAt: string
  reward: boolean
}

interface ReferralsResult {
  referrals: Referral[]
}

const fetcher = (url: string): any => fetch(url).then((res) => res.json())

export function useReferrals () {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const accountEmail = account?.toEmail()
  const [referrerEmail, setReferrerEmail] = useState<string>()
  const email = accountEmail || referrerEmail
  const { data: refcodeResult, mutate: mutateRefcode, isLoading: refcodeIsLoading } = useSWR<RefcodeResult>(email && `/referrals/refcode/${encodeURIComponent(email)}`, fetcher)
  const refcode = refcodeResult?.refcode
  const { data: referralsResult, isLoading: referralsAreLoading } = useSWR<ReferralsResult>(refcode && `/referrals/list/${refcode}`, fetcher)
  const referrals = referralsResult?.referrals
  const referralLink = refcode && `${location.protocol}//${location.host}/?refcode=${refcode}`
  return {
    refcodeIsLoading, referralsAreLoading,
    referrerEmail, setReferrerEmail, accountEmail, email,
    refcode, createRefcode, mutateRefcode, referrals, referralLink
  }
}

export function useReferredBy () {
  const [{ accounts }] = useW3()
  const account = accounts[0]
  const email = account?.toEmail()
  const { data: referredByResult, isLoading: referredByIsLoading } = useSWR<RefcodeResult>(email && `/referrals/referredby/${encodeURIComponent(email)}`, fetcher)
  const referredBy = referredByResult?.refcode
  return {
    referredBy
  }
}

function useURLRefcode () {
  const searchParams = useSearchParams()
  return searchParams.get('refcode')
}

export function useRecordRefcode () {
  const [{ email }] = useAuthenticator()
  const urlRefcode = useURLRefcode()
  useEffect(() => {
    (async function createReferralForEmailAndReferrer () {
      if (email && urlRefcode) {
        const formData = new FormData()
        formData.append('email', email)
        formData.append('refcode', urlRefcode)
        console.log(`recording ${email} as referred by ${urlRefcode}`)
        await createReferral(formData)
      }
    })()
  }, [email, urlRefcode])

  const { data: referredByResult, isLoading } = useSWR<RefcodeResult>(email && `/referrals/referredby/${encodeURIComponent(email)}`, fetcher)
  const referredBy = referredByResult?.refcode

  return { referredBy: referredBy || urlRefcode, isLoading }
}