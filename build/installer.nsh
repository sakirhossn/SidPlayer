!macro customInstall
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe" "FriendlyAppName" "SidPlayer"
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe" "ApplicationCompany" "SidPlayer Team"
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe" "Icon" "$INSTDIR\SidPlayer.exe,0"
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\DefaultIcon" "" "$INSTDIR\SidPlayer.exe,0"
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\shell\open\command" "" '"$INSTDIR\SidPlayer.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".mp4" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".mkv" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".webm" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".avi" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".mov" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".wmv" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".flv" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".m4v" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".ts" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".mpg" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".mpeg" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".3gp" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".m2ts" ""
  WriteRegStr HKCU "Software\Classes\Applications\SidPlayer.exe\SupportedTypes" ".vob" ""

  WriteRegStr HKCU "Software\Classes\SidPlayer.Video" "" "Video File"
  WriteRegStr HKCU "Software\Classes\SidPlayer.Video\DefaultIcon" "" "$INSTDIR\SidPlayer.exe,0"
  WriteRegStr HKCU "Software\Classes\SidPlayer.Video\shell\open\command" "" '"$INSTDIR\SidPlayer.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\video\shell\SidPlayer" "" "Play with SidPlayer"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\video\shell\SidPlayer" "Icon" "$INSTDIR\SidPlayer.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\video\shell\SidPlayer\command" "" '"$INSTDIR\SidPlayer.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\Directory\shell\SidPlayer" "" "Play with SidPlayer"
  WriteRegStr HKCU "Software\Classes\Directory\shell\SidPlayer" "Icon" "$INSTDIR\SidPlayer.exe,0"
  WriteRegStr HKCU "Software\Classes\Directory\shell\SidPlayer\command" "" '"$INSTDIR\SidPlayer.exe" "%1"'

  WriteRegStr HKCU "Software\Classes\.mp4\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.mkv\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.webm\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.avi\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.mov\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.wmv\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.flv\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.m4v\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.ts\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.mpg\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.mpeg\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.3gp\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.m2ts\OpenWithProgids" "SidPlayer.Video" ""
  WriteRegStr HKCU "Software\Classes\.vob\OpenWithProgids" "SidPlayer.Video" ""
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\Applications\SidPlayer.exe"
  DeleteRegKey HKCU "Software\Classes\SidPlayer.Video"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\video\shell\SidPlayer"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\SidPlayer"

  DeleteRegValue HKCU "Software\Classes\.mp4\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.mkv\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.webm\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.avi\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.mov\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.wmv\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.flv\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.m4v\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.ts\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.mpg\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.mpeg\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.3gp\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.m2ts\OpenWithProgids" "SidPlayer.Video"
  DeleteRegValue HKCU "Software\Classes\.vob\OpenWithProgids" "SidPlayer.Video"
!macroend
