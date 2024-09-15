<?php

  namespace App\Http\Controllers;
  
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Validator;
    use App\Models\User;
    use Tymon\JWTAuth\Facades\JWTAuth;

    class AuthController extends Controller
    {
        public function register(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:6|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 400);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $token = JWTAuth::attempt($request->only('email', 'password'));

            return response()->json(compact('user', 'token'));
        }

        public function login(Request $request)
        {
            $validator = Validator::make($request->all(), [
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 400);
            }

            if (!$token = JWTAuth::attempt($request->only('email', 'password'))) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $user = JWTAuth::user();

            return response()->json(compact('user', 'token'));
        }

        public function me()
        {
            return response()->json(auth()->user());
        }


        // AuthController.php
        public function updateProfile(Request $request)
        {
            $user = auth()->user();
        
            if (!$user instanceof User) {
                return response()->json(['error' => 'User not found'], 404);
            }
        
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'nullable|string|min:6|confirmed',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:112048', // Validate image
            ]);
        
            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 400);
            }
        
            $user->name = $request->name;
            $user->email = $request->email;
        
            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }
        
            if ($request->hasFile('avatar')) {
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
                $user->avatar = $avatarPath;
            }
        
            $user->save();
        
            return response()->json(['message' => 'Profile updated successfully', 'user' => $user]);
        }
        
    }
