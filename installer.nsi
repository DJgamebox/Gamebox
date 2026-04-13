; NSIS Installation Script - Game Box
Unicode true
SetCompressor lzma
!include "MUI2.nsh"

Name "Game Box"
OutFile "dist\game-box Setup 1.0.2.exe"
InstallDir "$LOCALAPPDATA\game-box"
RequestExecutionLevel user

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "dist\win-unpacked\*.*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Game Box"
  CreateShortcut "$SMPROGRAMS\Game Box\Game Box.lnk" "$INSTDIR\game-box.exe"
  CreateShortcut "$SMPROGRAMS\Game Box\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Game Box.lnk" "$INSTDIR\game-box.exe"
SectionEnd

Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$SMPROGRAMS\Game Box\Game Box.lnk"
  Delete "$SMPROGRAMS\Game Box\Uninstall.lnk"
  RMDir "$SMPROGRAMS\Game Box"
  Delete "$DESKTOP\Game Box.lnk"
SectionEnd
