import { Stack } from "@mui/material"
import { useSearchParams } from "next/navigation"

const ReceiptPage = () => {
    const searchParams = useSearchParams()
    return <Stack>
        {searchParams.get("id")}
    </Stack>
}

export default ReceiptPage