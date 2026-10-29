param([ValidateSet('find-folder')][string]$Mode='find-folder',[string]$TargetPath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false)
$folder=(Resolve-Path -LiteralPath $TargetPath).ProviderPath.TrimEnd('\')
if(-not(Test-Path -LiteralPath $folder -PathType Container)){throw 'Expected a directory'}
$shell=New-Object -ComObject Shell.Application
$handle=0
for($attempt=0;$attempt -lt 30;$attempt++){
  foreach($window in @($shell.Windows())){try{if(([string]$window.Document.Folder.Self.Path).TrimEnd('\') -ieq $folder){$handle=[long]$window.HWND;break}}catch{}}
  if($handle){break};Start-Sleep -Milliseconds 100
}
@{ok=[bool]$handle;hwnd=$handle;path=$folder}|ConvertTo-Json -Compress
