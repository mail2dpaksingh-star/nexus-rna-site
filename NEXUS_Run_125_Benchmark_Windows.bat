@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NEXUS ThermoFold - 125 case RNAfold reference benchmark

echo ========================================================
echo NEXUS ThermoFold - Genuine RNAfold benchmark

echo ========================================================
echo This tool requires Python and an installed RNAfold.exe.
echo This tool does not install software or upload sequences.
echo.
set "PYTHON_CMD=python"
where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Python was not found on PATH.
    goto FAIL
  )
  set "PYTHON_CMD=py -3"
)
where RNAfold >nul 2>nul
if errorlevel 1 (
  echo ERROR: RNAfold.exe was not found on PATH.
  echo Install the official ViennaRNA Windows package and ensure RNAfold.exe is available.
  echo Then open a fresh terminal and run RNAfold --version.
  goto FAIL
)

echo Checking reference engine version...
RNAfold --version
if errorlevel 1 goto FAIL

echo.
echo Fetching version-pinned official Turner 2004 parameter file...
%PYTHON_CMD% benchmark_tools\fetch_turner2004_official.py
if errorlevel 1 (
  echo Fetch failed. Verify network access to the pinned ViennaRNA source.
  goto FAIL
)

echo.
echo Running 125 real RNAfold calculations at 37 C with -d2...
%PYTHON_CMD% benchmark_tools\turner2004_125_controlled.py --parameters reference_parameters\rna_turner2004.par --cases tools\seqfold\benchmarks\challenge_cases.json --output validation_results\rnafold_turner2004_125.json --progress
if errorlevel 1 goto FAIL

echo.
echo Verifying all 125 reference records, settings and hashes...
%PYTHON_CMD% benchmark_tools\verify_turner2004_suite.py --references validation_results\rnafold_turner2004_125.json --manifest validation_results\rnafold_turner2004_125.manifest.json
if errorlevel 1 goto FAIL

echo.
echo Computing comparison with the existing NEXUS baseline...
%PYTHON_CMD% benchmark_tools\compare_125_controlled.py --references validation_results\rnafold_turner2004_125.json --manifest validation_results\rnafold_turner2004_125.manifest.json --nexus validation_results\nexus_125_internal_baseline.json
if errorlevel 1 goto FAIL

echo.
echo ========================================================
echo SUCCESS: Actual external RNAfold reference comparison completed.
echo Upload these files to the ChatGPT conversation:
echo   validation_results\controlled_125_comparison.json

echo   validation_results\rnafold_turner2004_125.manifest.json

echo   validation_results\verified_reference.json

echo ========================================================
pause
exit /b 0
:FAIL
echo.
echo No external accuracy results should be reported for a failed run.
echo Check the error message above and follow the setup instructions.
pause
exit /b 1
