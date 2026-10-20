$ppt = [System.Runtime.InteropServices.Marshal]::GetActiveObject('PowerPoint.Application')
if ($ppt) {
    foreach ($pres in $ppt.Presentations) {
        if ($pres.Name -like "*WINHUB_리뉴얼_combine_v2_압축수정*") {
            Write-Output "Closing presentation: $($pres.Name)"
            $pres.Close()
        }
    }
}
