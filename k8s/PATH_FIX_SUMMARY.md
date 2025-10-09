# Deploy Script Path Fix - Summary

## Issue
The `k8s/deploy.sh` script couldn't find `Dockerfile.k8s` because it was looking in the wrong directory (relative path from k8s/ instead of parent directory).

## Solution
Updated `deploy.sh` to:

1. **Auto-detect script location** and project root:
   ```bash
   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
   ```

2. **Use absolute paths** for all files:
   ```bash
   DOCKERFILE="${PROJECT_ROOT}/Dockerfile.k8s"
   K8S_DIR="${PROJECT_ROOT}/k8s"
   ```

3. **Validate files exist** before building:
   ```bash
   if [ ! -f "${DOCKERFILE}" ]; then
       log_error "Dockerfile not found at: ${DOCKERFILE}"
       exit 1
   fi
   ```

4. **Use correct build context**:
   ```bash
   docker build -t "${FULL_IMAGE}" -f "${DOCKERFILE}" "${PROJECT_ROOT}"
   ```

## Benefits
- ✅ Script can be run from any directory
- ✅ Always finds Dockerfile correctly
- ✅ Uses project root as build context
- ✅ Validates files exist before building
- ✅ Shows helpful error messages with full paths
- ✅ All kubectl commands use absolute paths

## Testing
```bash
# Works from k8s/ directory
cd k8s && ./deploy.sh

# Works from project root
./k8s/deploy.sh

# Works from anywhere
/path/to/project/k8s/deploy.sh
```

## Updated Files
1. `k8s/deploy.sh` - Main deployment script (path fixes)
2. `K8S_DEPLOYMENT.md` - Updated build commands documentation
3. `K8S_SETUP_SUMMARY.md` - Updated example commands
4. `k8s/README.md` - Updated next steps section

## Verification
Script now correctly identifies:
- Project root: `/Users/nirwolff/JenKinds`
- Dockerfile: `/Users/nirwolff/JenKinds/Dockerfile.k8s`
- K8s directory: `/Users/nirwolff/JenKinds/k8s`

All paths are resolved correctly regardless of where the script is executed from!
