import { ImageResponse } from 'next/og'

export const size = {
  width: 24,
  height: 24
}

export const contentType = 'image/png'

// Shared logo path for reuse
export const logoPath = "M5.5 3.5C3.84315 3.5 2.5 4.84315 2.5 6.5V17.5C2.5 19.1569 3.84315 20.5 5.5 20.5H18.5C20.1569 20.5 21.5 19.1569 21.5 17.5V6.5C21.5 4.84315 20.1569 3.5 18.5 3.5H5.5ZM7.28033 7.71967C6.98744 7.42678 6.51256 7.42678 6.21967 7.71967C5.92678 8.01256 5.92678 8.48744 6.21967 8.78033L8.68934 11.25L6.21967 13.7197C5.92678 14.0126 5.92678 14.4874 6.21967 14.7803C6.51256 15.0732 6.98744 15.0732 7.28033 14.7803L10.2803 11.7803C10.5732 11.4874 10.5732 11.0126 10.2803 10.7197L7.28033 7.71967ZM13.5 13C13.0858 13 12.75 13.3358 12.75 13.75C12.75 14.1642 13.0858 14.5 13.5 14.5H16.5C16.9142 14.5 17.25 14.1642 17.25 13.75C17.25 13.3358 16.9142 13 16.5 13H13.5Z"

// Reusable Logo component
export function Logo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={logoPath}
        fill="currentColor"
      />
    </svg>
  )
}

export default function LogoIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent'
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d={logoPath}
            fill="black"
          />
        </svg>
      </div>
    ),
    {
      ...size
    }
  )
}
